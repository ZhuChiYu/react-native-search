import {
  View,
  Text,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import React, { Component } from 'react';

import PropTypes from 'prop-types';
import Theme from './Theme';
import * as DataBase from './DataBase'

const { cancelButtonWidth: buttonWidth, searchBarHorizontalPadding, searchIconWidth } = Theme.size;

export default class SearchBar extends Component {
  static propTypes = {
    placeholder: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func, // search input value changed callback,

    onFocus: PropTypes.func, // search input focused callback
    onBlur: PropTypes.func, // search input blured callback
    onSubmitEditing: PropTypes.func, // search input submit callback

    renderCancel: PropTypes.func, // render cancel button if need custom stylring
    renderCancelWhileSearching: PropTypes.func,
    cancelContainerStyle: PropTypes.object, // style properties for the container of the cancel button
    staticCancelButton: PropTypes.bool,

    onClickCancel: PropTypes.func, // the search cancel button clicked
    cancelTitle: PropTypes.string, // title for the search cancel button
    cancelTextStyle: PropTypes.object, // color for the search cancel button

    searchInputBackgroundColor: PropTypes.string, // default state background color for the search input
    searchInputBackgroundColorActive: PropTypes.string, // active state background color for the search input
    searchInputPlaceholderColor: PropTypes.string, // default placeholder color for the search input
    searchInputTextColor: PropTypes.string, // default state text color for the search input
    searchInputTextColorActive: PropTypes.string, // active state text color for the search input
    searchInputStyle: PropTypes.object, // style properties for the search input

    searchBarBackgroundColor: PropTypes.string, // active state background color for the search bar

    showSearchIcon: PropTypes.bool,
    isSearching: PropTypes.bool, // Determines if the searchbar is currently focused,
    searchBarStyle: PropTypes.object
  };

  static defaultProps = {
    searchInputBackgroundColor: '#ffffff',
    searchInputBackgroundColorActive: '#171a23',

    searchInputPlaceholderColor: '#979797',
    searchInputTextColor: '#171a23',
    searchInputTextColorActive: '#ffffff',

    searchBarBackgroundColor: '#171a23',

    cancelTitle: 'Cancel',

    showSearchIcon: true,
    staticCancelButton: false
  };

  currentValue: string;

  constructor(props) {
    super(props);
    if (this.props.value !== undefined) {
        this.currentValue = this.props.value;
    } else {
        this.currentValue = '';
    }
    this.state = {
      value: props.defaultValue,
      isSearching: props.defaultValue !== '',
      animatedValue: new Animated.Value(0),
      showClearButton: this._needToShowClearButton(this.currentValue, false),
      searchHistory: [], // 搜索历史数组
      focused: false
    };

    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onSubmitEditing = this.onSubmitEditing.bind(this);
    this.onChange = this.onChange.bind(this);
    this.cancelSearch = this.cancelSearch.bind(this);
  }
  _needToShowClearButton(text: string, editing: boolean): boolean {
    if (text === undefined || text === '') {
        // if change to empty, hide the button
        return false;
    } else {
        // value is not empty
        if (editing) {
            // in editing, always and while-editing should show
            if (this.props.clearButtonMode === 'always' ||
                this.props.clearButtonMode === 'while-editing') {
                return true;
            }
        } else {
            // not in editing, always and unless-editing should show
            if (this.props.clearButtonMode === 'always' ||
                this.props.clearButtonMode === 'unless-editing') {
                return true;
            }
        }
    }
    return false;
  }

  _handleTextChanged(text: string, editing: boolean) {
    let show = this._needToShowClearButton(text, editing);
    // if current state is not the same with the calculated one, refresh
    if (show !== this.state.showClearButton) {
        this.setState({showClearButton: show});
    }
  }

  _clearText() {
    let textInput: TextInput = this.refs.input;
    // clear the value
    this.currentValue = '';
    textInput.clear();
    // handle clear button
    this._handleTextChanged(this.currentValue, textInput.isFocused());
  }

  onChange(value) {
    this.currentValue = value;
    this._handleTextChanged(value, true);
    this.props.onChange && this.props.onChange(value);
    this.setState({ value });
  }

  onBlur() {
    this.setState({
      focused: false
    })
    this.props.onBlur && this.props.onBlur();
  }

  onFocus() {
    // this.searchingAnimation(true);
    this.setState({
      isSearching: true,
      focused: true
    })
    this.props.onFocus && this.props.onFocus();
  }

  onSubmitEditing() {
    if (this.state.value === '') {
      this.cancelSearch();
    } else {
      this.insertSearch(this.state.value)
      this.getHistory()
    }
    this.props.onSubmitEditing && this.props.onSubmitEditing();
  }

  searchingAnimation(isSearching) {
    let toVal = 0;

    if (isSearching) {
      this.state.animatedValue.setValue(0);
      toVal = buttonWidth;
    } else {
      this.state.animatedValue.setValue(buttonWidth);
      toVal = 0;
    }

    Animated.timing(this.state.animatedValue, {
      duration: Theme.duration.toggleSearchBar,
      toValue: toVal
    }).start(() => {
      this.setState({ isSearching });
    });
  }

  setText(text: ?string, updateUI: boolean = true) {
    let newText = '';
    if (text != null) {
        if (typeof text == 'string') {
            newText = text;
        } else {
            newText = text.toString();
        }
    }
    if (updateUI) {
        this.setState({value: newText});
    } else {
        this.state.value = newText;
    }
  }

  _clearText = () => {
    this.setText('');
    if (this.props.onChangeText) {
        this.props.onChangeText('');
    }
  };

  cancelSearch() {
    console.log("searchHistory!!!",this.state.searchHistory)
    this.refs.input.clear();
    this.refs.input.blur();
    this.setState({ value: '', isSearching: false });
    this.searchingAnimation(false);
    this.props.onClickCancel && this.props.onClickCancel();

  }

  //获取历史记录
  getHistory() {
    // 查询本地历史记录
    DataBase.getData("storeHistory").then(data => {
        if (data == null) {
            this.setState({
                searchHistory: [],
            })
        } else {
            this.setState({
                searchHistory: data,
            })
        }
    })
  }

  // 保存搜索记录
  insertSearch(text) {
    if (this.state.searchHistory.indexOf(text) != -1) {
        // 本地历史 已有 搜索内容
        let index = this.state.searchHistory.indexOf(text);
        let tempArr = DataBase.arrDelete(this.state.searchHistory, index)
        tempArr.unshift(text);
        DataBase.addData(tempArr);
    } else {
        // 本地历史 无 搜索内容
        let tempArr = this.state.searchHistory;
        let historyLength = tempArr.length
        //
        if (historyLength < 10) {
          tempArr.unshift(text);
          DataBase.addData(tempArr);
        } else {
          //若超过长度限制，则先删除列表最后一项，然后在头部插入value
          let tempArr = DataBase.arrDelete(this.state.searchHistory, historyLength - 1)
          tempArr.unshift(text);
          DataBase.addData(tempArr);
        }
    }
  }

  render() {
    return (
      <View
        style={[
          this.props.style,
          {
            flexDirection: 'row',
            padding: searchBarHorizontalPadding,
            height: Theme.size.searchInputHeight,
            backgroundColor: this.props.searchBarBackgroundColor
          },
          {
            width: Theme.size.windowWidth + buttonWidth
          },
          this.props.searchBarStyle
        ]}>
        <Animated.View
          style={{
            width: this.state.animatedValue.interpolate({
              inputRange: [0, buttonWidth],
              // Control total width of searchBar
              outputRange: [
                this.props.staticCancelButton
                  ? Theme.size.windowWidth - buttonWidth - searchBarHorizontalPadding
                  : Theme.size.windowWidth - searchBarHorizontalPadding * 2,
                Theme.size.windowWidth - buttonWidth - searchBarHorizontalPadding
              ]
            }),
            backgroundColor: this.state.animatedValue.interpolate({
              inputRange: [0, buttonWidth],
              outputRange: [
                this.props.searchInputBackgroundColor,
                this.props.searchInputBackgroundColorActive
              ]
            }),
            height: 28,
            borderRadius: 5
          }}>
          <TextInput
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onSubmitEditing={this.onSubmitEditing}
            ref="input"
            style={[
              styles.searchTextInputStyle,
              this.props.showSearchIcon ? '' : { paddingLeft: 8 },
              {
                color:
                  this.props.searchInputTextColorActive && !this.state.isSearching
                    ? this.props.searchInputTextColorActive
                    : this.props.searchInputTextColor || '#979797'
              },
              this.props.searchInputStyle
            ]}
            onChangeText={this.onChange}
            value={this.state.value}
            underlineColorAndroid="transparent"
            placeholder={this.props.placeholder}
            returnKeyType="search"// 键盘确定按钮类型
          />
          
          
          {/* {this.state.showClearButton &&
          <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => {
                  // clear text
                  this._clearText();
                  // trigger a onChangeTest
                  onChangeText && onChangeText(this.currentValue);
                  // focus if it's not focused
                  if (!this.refs.input.isFocused()) {
                      this.refs.input.focus();
                  }
              }}
          >
              <Image
                  source={require('../images/textclear_nor.png')}
                  style={{
                      marginLeft: 8,
                      height: 24,
                      width: 24,
                  }}
              />
          </TouchableOpacity>
          } */}

          <Animated.View pointerEvents="none" style={[styles.leftSearchIconStyle]}>
            {this.props.showSearchIcon ? (
              <Image style={styles.searchIconStyle} source={require('../images/icon-search.png')} />
            ) : null}
            
          </Animated.View>
          {this.state.focused && this.state.value != null && this.state.value.length > 0 && (
            <TouchableOpacity onPress={this._clearText}
              style={styles.rightCancelIconStyle}>
                <Image style={styles.cancelIconStyle} source={require('../images/textclear_nor.png')}/>
            </TouchableOpacity>
          )}

        </Animated.View>
        <View style={[styles.cancelContainer, this.props.cancelContainerStyle]}>
          <TouchableWithoutFeedback onPress={this.cancelSearch}>
            {this.state.isSearching
              ? this._renderCancelWhileSearching.bind(this)()
              : this._renderCancel.bind(this)()}
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  }

  /**
   * render the default Cancel Button
   * @returns {XML}
   * @private
   */
  _renderDefaultCancel() {
    const { cancelTitle, cancelTextStyle } = this.props;

    return (
      <View
        style={{
          flex: 1,
          height: Theme.size.searchInputHeight,
          width: buttonWidth,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 5
        }}
        shouldRasterizeIOS
        renderToHardwareTextureAndroid>
        <Text style={[{ color: '#000' }, cancelTextStyle]} numberOfLines={1}>
          {cancelTitle}
        </Text>
      </View>
    );
  }

  /**
   * render Cancel Button
   * @returns {XML}
   * @private
   */
  _renderCancel() {
    const { renderCancel } = this.props;
    return renderCancel ? renderCancel() : this._renderDefaultCancel();
  }

  /**
   * render Cancel Button while searching
   * @returns {XML}
   * @private
   */
  _renderCancelWhileSearching() {
    const { renderCancelWhileSearching } = this.props;
    return renderCancelWhileSearching ? renderCancelWhileSearching() : this._renderDefaultCancel();
  }
}

const styles = StyleSheet.create({
  cancelContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  searchTextInputStyle: {
    flex: 1,
    height: 28,
    padding: 0,
    paddingLeft: searchIconWidth,
    paddingRight: 8,
    borderRadius: 5
  },
  centerSearchIconStyle: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'stretch'
  },
  leftSearchIconStyle: {
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
    top: 0,
    bottom: 0,
    width: searchIconWidth
  },
  rightCancelIconStyle: {
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
    top: 0,
    bottom: 0,
    right:4,
    width: searchIconWidth
  },
  searchIconStyle: {
    width: 12,
    height: 12
  },
  cancelIconStyle: {
    width: 24,
    height: 24
  },
});
