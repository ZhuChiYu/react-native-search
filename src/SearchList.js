import {
  View,
  Text,
  StyleSheet,
  PixelRatio,
  Animated,
  Image,
  Platform,
  SectionList,
  TouchableOpacity
} from 'react-native';

import React, { Component } from 'react';

import pinyin from 'js-pinyin';
import PropTypes from 'prop-types';
import { sTrim } from './utils/utils';

import SearchBar from './components/SearchBar';
import Toolbar from './components/Toolbar';
import Touchable from './utils/Touchable';
import SectionIndex from './components/SectionIndex';
import Theme from './components/Theme';
import SearchService from './SearchService';
import HighlightableText from './components/HighlightableText';
import * as DataBase from './components/DataBase'

export default class SearchList extends Component {
  static propTypes = {
    //数据包含searchStr，用于检索
    data: PropTypes.array.isRequired,
    // 使用renderRow获取更大的自由度，自定义rowHeight,用于滚动计算，默认为40
    rowHeight: PropTypes.number.isRequired,

    //是否隐藏section
    hideSectionList: PropTypes.bool,

    //section头部的高度
    sectionHeaderHeight: PropTypes.number,

    searchListBackgroundColor: PropTypes.string,

    toolbarBackgroundColor: PropTypes.string,

    searchBarToggleDuration: PropTypes.number,
    searchBarBackgroundColor: PropTypes.string,

    searchInputBackgroundColor: PropTypes.string,
    searchInputBackgroundColorActive: PropTypes.string,
    // default state text color for the search input
    searchInputTextColor: PropTypes.string,
    // active state text color for the search input
    searchInputTextColorActive: PropTypes.string,
    searchInputPlaceholderColor: PropTypes.string,
    searchInputPlaceholder: PropTypes.string,
    searchInputDefaultValue: PropTypes.string,

    searchInputStyle: PropTypes.object,
    listContainerStyle: PropTypes.object,

    title: PropTypes.string,
    titleTextColor: PropTypes.string,

    cancelTitle: PropTypes.string,
    cancelTextColor: PropTypes.string,

    // use `renderSectionIndexItem` to get much more freedom
    sectionIndexTextColor: PropTypes.string,
    renderSectionIndexItem: PropTypes.func,
    sectionIndexContainerStyle: PropTypes.object,

    sortFunc: PropTypes.func,
    resultSortFunc: PropTypes.func,

    onScrollToSection: PropTypes.func,

    statusBarHeight: PropTypes.number,
    toolbarHeight: PropTypes.number,
    renderToolbar: PropTypes.func,
    renderCancel: PropTypes.func,
    renderCancelWhileSearching: PropTypes.func,
    cancelContainerStyle: PropTypes.object,
    staticCancelButton: PropTypes.bool,
    showSearchIcon: PropTypes.bool,
    searchBarStyle: PropTypes.object,
    searchBarContainerStyle: PropTypes.object,

    displayMask: PropTypes.bool,
    searchOnDefaultValue: PropTypes.bool,
    searchHistoryLimit: PropTypes.number,

    renderBackButton: PropTypes.func,
    renderRightButton: PropTypes.func,
    renderEmpty: PropTypes.func,
    renderEmptyResult: PropTypes.func,
    renderItemSeparator: PropTypes.func,
    renderSectionHeader: PropTypes.func,
    renderHeader: PropTypes.func,
    renderFooter: PropTypes.func,
    renderStickyHeader: PropTypes.func,
    renderRow: PropTypes.func.isRequired,

    onSearchStart: PropTypes.func,
    onSearchEnd: PropTypes.func
  };

  static defaultProps = {
    toolbarHeight: Theme.size.toolbarHeight,
    statusBarHeight: Theme.size.statusBarHeight,
    sectionHeaderHeight: Theme.size.sectionHeaderHeight,
    rowHeight: Theme.size.rowHeight,
    sectionIndexTextColor: '#171a23',
    searchListBackgroundColor: Theme.color.primaryDark,
    toolbarBackgroundColor: Theme.color.primaryDark,
    searchBarContainerStyle: {},
    displayMask: true,
    searchOnDefaultValue: false,
    searchHistoryLimit: 10,
  };

  constructor(props) {
    super(props);
    this.state = {
      isReady: false,
      isSearching: false, // 判断搜索框中是否有值
      isMatch: true, // 判断检索结果是否被匹配
      searchStr: '',// 搜索文字
      originalListData: [],
      sectionListData: [],
      sectionIds: [],
      animatedValue: new Animated.Value(0),
      searchHistory: [], // 搜索历史数组
      isShowHistory: false
    };

    this.search = this.search.bind(this);
    this.cancelSearch = this.cancelSearch.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.scrollToSection = this.scrollToSection.bind(this);

    pinyin.setOptions({ checkPolyphone: false, charCase: 2 });
  }

  componentDidMount() {
    this.initList(this.props.data).then(() => {
      if (this.props.searchOnDefaultValue && this.props.searchInputDefaultValue != '') {
        this.search(this.props.searchInputDefaultValue);
        this.enterSearchState();
      }
    });
  }

  initList(data = []) {
    return new Promise((resolve, reject) => {
      const copiedSource = Array.from(data);
      this.setState({ originalListData: copiedSource });
      this.parseInitList(
        SearchService.sortList(SearchService.initList(copiedSource), this.props.sortFunc)
      );
      resolve();
    });
  }

  parseInitList(srcList) {
    const { formattedData, sectionIds } = SearchService.parseList(srcList);
    this.setState({
      isReady: true,
      isSearching: false,
      sectionListData: formattedData,
      sectionIds
    });
  }

  search(input) {
    this.setState({ searchStr: input });

    const { originalListData } = this.state;

    if (input) {
      this.setState({ isShowHistory: false})
      input = sTrim(input);
      const tempResult = SearchService.search(originalListData, input.toLowerCase());
      if (tempResult.length === 0) {
        this.setState({
          isSearching: true,

          isMatch: false,
          sectionListData: Array.from(this.state.sectionListData) //将其他对象转换成数组
        });
      } else {
        const { searchResultData } = SearchService.sortResultList(
          tempResult,
          this.props.resultSortFunc
        );
        this.setState({
          isSearching: false,
          isMatch: true,
          sectionListData: searchResultData
        });
      }
    } else {
      this.parseInitList(originalListData);
    }
  }

  /**
   * default section header in SectionList
   * @param sectionData
   * @param sectionID
   * @returns {XML}
   * @private
   */
  _renderSectionHeader({ section: { title } }) {
    const { sectionHeaderHeight, sectionHeaderStyle, sectionTitleStyle } = this.props;

    return (
      <View style={[styles.sectionHeader, sectionHeaderStyle]}>
        <View
          style={{
            justifyContent: 'center',
            height: sectionHeaderHeight
          }}>
          <Text style={[styles.sectionTitle, sectionTitleStyle]}>{title}</Text>
        </View>
      </View>
    );
  }

  /**
   * default section index item
   * @param sectionData
   * @param sectionID
   * @returns {XML}
   * @private
   */
  _renderSectionIndexItem(section) {
    return (
      <Text
        style={[{
          textAlign: 'center',
          color: '#000',
          height:20,
        }, this.props.sectionIndexTextSytle]}>
        {section}
      </Text>
    );
  }

  /**
   * default render Separator
   * @param sectionID
   * @param rowID
   * @param adjacentRowHighlighted
   * @returns {XML}
   */
  _renderItemSeparator({ section: { title }, highlighted, leadingSection, trailingSection }) {
    let style = styles.rowSeparator;
    if (highlighted) {
      style = [style, styles.rowSeparatorHide];
    }
    const randomKey = Math.random().toString(36).substring(2, 15);

    return (
      <View key={randomKey} style={style}>
        <View
          style={{
            height: 1 / PixelRatio.get(),
            backgroundColor: '#E0E0E0'
          }}
        />
      </View>
    );
  }

  /**
   * render default list view footer
   * @returns {XML}
   * @private
   */
  _renderFooter() {
    return <View style={styles.scrollSpinner} />;
  }

  /**
   * render default list view header
   * @returns {null}
   * @private
   */
  _renderHeader() {
    return null;
  }

  _renderEmptyResult () {
    return (
      <View style={styles.emptyDataSource}>
        <Text style={{color: '#000', fontSize: 16, paddingTop: 100, opacity: 0.3, lineHeight: 24}}> 暂无搜索记录 </Text>
      </View>
      
    )
  }

  /**
   *
   * @param item
   * @param sectionID
   * @param rowID
   * @param highlightRowFunc
   * @returns {XML}
   * @private
   */
  _renderRow({ index, item, section }) {
    return (
      <View
        style={{
          flex: 1,
          marginLeft: 20,
          height: this.props.rowHeight,
          justifyContent: 'center',
          height: 56
        }}>
        
        <HighlightableText
          text={item.searchStr}
          matcher={item.matcher}
          textStyle={this.props.rowTextStyle}
          choosenTextStyle={this.props.choosenRowTextStyle}
          unchoosenTextStyle={this.props.unchoosenRowTextStyle}
        />
      </View>
    );
  }

  //此时为进入搜索状态，返回检索记录
  enterSearchState() {
    this.setState({ isSearching: true });
    // Animated.timing(this.state.animatedValue, {
    //   duration: this.props.searchBarToggleDuration || Theme.duration.toggleSearchBar,
    //   toValue: 1,
    //   useNativeDriver: true
    // }).start(() => {});
  }

  exitSearchState() {
    // Animated.timing(this.state.animatedValue, {
    //   duration: this.props.searchBarToggleDuration || Theme.duration.toggleSearchBar,
    //   toValue: 0,
    //   useNativeDriver: true
    // }).start(() => {
    //   this.search('');
    //   this.setState({ isSearching: false });
    // });
    this.search('');
    // this.setState({ isSearching: false })
    this.setState({ isSearching: false, isMatch: true });
  }

  onFocus() {
    this.getHistory();
    if (!this.state.isSearching) {
      this.enterSearchState();
      this.setState({isShowHistory: true})
    }
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

  // // 保存搜索记录
  // insertSearch(text) {
  //   if (this.state.searchHistory.indexOf(text) != -1) {
  //       // 本地历史 已有 搜索内容
  //       let index = this.state.searchHistory.indexOf(text);
  //       let tempArr = DataBase.arrDelete(this.state.searchHistory, index)
  //       tempArr.unshift(text);
  //       DataBase.addData("searchHistory", tempArr);
  //   } else {
  //       // 本地历史 无 搜索内容
  //       let tempArr = this.state.searchHistory;
  //       let historyLength = tempArr.length
  //       //
  //       if (historyLength < this.props.searchHistoryLimit) {
  //         tempArr.unshift(text);
  //         DataBase.addData("searchHistory", tempArr);
  //       } else {
  //         //若超过长度限制，则先删除列表最后一项，然后在头部插入value
  //         let tempArr = DataBase.arrDelete(this.state.searchHistory, historyLength - 1)
  //         tempArr.unshift(text);
  //         DataBase.addData("searchHistory", tempArr);
  //       }
  //   }
  // }

  renderhistorySearch() {
    return(
      this.state.searchHistory.length > 0 ?
      <View style={styles.searchMainLabel}>
          {this.state.searchHistory.map((item, index) => {
              return (
                <TouchableOpacity
                    activeOpacity={.8}
                    style={styles.searchLabelBox}
                    key={index}>
                    <Text numberOfLines={1} style={styles.searchLabelText}>{item}</Text>
                </TouchableOpacity>
            )
          })
          }
      </View>
      : <View style={styles.noData}>
          <Text style={styles.noDataTxt}>暂无搜索历史</Text>
      </View>
    )
  }
  renderNoMatch() {
    return(
      <View style={styles.emptySearchResult}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> 无结果</Text>
      </View>
    )
  }

  onBlur() {
    this.setState({isShowHistory: false})
    this.props.onSearchEnd && this.props.onSearchEnd();
  }

  // onSubmitEditing() {
  //   console.log()
  //   this.insertSearch(this.state.searchStr);
  // }

  onClickCancel() {
    this.exitSearchState();
    this.props.onSearchEnd && this.props.onSearchEnd();
  }

  cancelSearch() {
    this.refs.searchBar && this.refs.searchBar.cancelSearch && this.refs.searchBar.cancelSearch();
  }

  onSearchStart() {
    console.log("asdfasdfasdf")
    return (
      <View style={styles.emptySearchResult}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> No Result For <Text
          style={{color: '#171a23', fontSize: 18}}>dasdasd</Text></Text>
        <Text style={{color: '#979797', fontSize: 18, alignItems: 'center', paddingTop: 10}}>Please search again</Text>
      </View>
    )
  }

  scrollToSection(sectionIndex) {
    const { sectionIds } = this.state;

    if (!sectionIds || sectionIds.length === 0) {
      return;
    }

    this.refs.searchListView.scrollToLocation({
      itemIndex: 0,
      sectionIndex,
      animated: false
    });

    this.props.onScrollToSection && this.props.onScrollToSection(sectionIndex);
  }

  render() {
    const {isSearching, isShowHistory, isMatch} = this.state
    return (
      <View
        ref="view"
        style={[
          {
            // 考虑上动画以后页面要向上移动，这里必须拉长
            height: Theme.size.windowHeight + this.props.toolbarHeight,
            width: Theme.size.windowWidth,
          },
          this.props.style
        ]}>
        <View
          style={[
            {
              flex: 1,
              backgroundColor: this.props.searchListBackgroundColor
            }
          ]}>
          {/* {this._renderToolbar()} */}

          <View style={this.props.searchBarContainerStyle}>
            <SearchBar
              placeholder={
                this.props.searchInputPlaceholder ? this.props.searchInputPlaceholder : ''
              }
              defaultValue={
                this.props.searchInputDefaultValue ? this.props.searchInputDefaultValue : ''
              }
              onChange={this.search}
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              onClickCancel={this.onClickCancel}
              cancelTitle={this.props.cancelTitle}
              cancelTextStyle={this.props.cancelTextStyle}
              searchBarBackgroundColor={this.props.searchBarBackgroundColor}
              searchInputBackgroundColor={this.props.searchInputBackgroundColor}
              searchInputBackgroundColorActive={this.props.searchInputBackgroundColorActive}
              searchInputPlaceholderColor={this.props.searchInputPlaceholderColor}
              searchInputTextColor={this.props.searchInputTextColor}
              searchInputTextColorActive={this.props.searchInputTextColorActive}
              searchInputStyle={this.props.searchInputStyle}
              renderCancel={this.props.renderCancel}
              renderCancelWhileSearching={this.props.renderCancelWhileSearching}
              cancelContainerStyle={this.props.cancelContainerStyle}
              staticCancelButton={this.props.staticCancelButton}
              showSearchIcon={this.props.showSearchIcon}
              searchBarStyle={this.props.searchBarStyle}
              ref="searchBar"
            />
          </View>
          {this._renderStickyHeader()}

          <View
            shouldRasterizeIOS
            renderToHardwareTextureAndroid
            style={[styles.listContainer, this.props.listContainerStyle]}>
            {isShowHistory ? this.renderhistorySearch() :
            (isMatch ?  this._renderSearchBody.bind(this)() : this.renderNoMatch())}
            {this._renderSectionIndex.bind(this)()}
          </View>
        </View>

        {/* {this.props.displayMask ? this._renderMask.bind(this)() : null} */}
      </View>
    );
  }
  
  /**
   * render the main list view
   * @returns {*}
   * @private
   */
  _renderSearchBody() {
    const { isReady, isSearching, searchStr, sectionListData } = this.state;
    const { renderEmptyResult, renderEmpty, data } = this.props;

    if (isSearching && !isReady && renderEmptyResult && searchStr !== '') {
      return this._renderEmptyResult();
    }
    if (data && data.length > 0 && isReady) {
      return (
        <SectionList
          ref="searchListView"
          keyExtractor={(item, index) =>
            item.searchStr + index + Math.random().toString(36).substring(2, 15)
          }
          sections={sectionListData}
          initialNumToRender={15}
          onEndReachedThreshold={30}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator
          renderItem={this.props.renderRow || this._renderRow.bind(this)}
          ItemSeparatorComponent={
            this.props.renderItemSeparator || this._renderItemSeparator.bind(this)
          }
          renderSectionHeader={
            this.props.renderSectionHeader || this._renderSectionHeader.bind(this)
          }
          ListFooterComponent={this.props.renderFooter || this._renderFooter.bind(this)}
          ListHeaderComponent={this.props.renderHeader || this._renderHeader.bind(this)}
          onScrollToIndexFailed={() => {}}
        />
      );
    }
    if (renderEmpty) {
      return renderEmpty();
    }
  }

  /**
   * render a custom sticky header, isSearching is pass to renderStickyHeader
   * @returns {*}
   * @private
   */
  _renderStickyHeader() {
    const { renderStickyHeader } = this.props;
    const { isSearching } = this.state;
    return renderStickyHeader ? renderStickyHeader(isSearching) : null;
  }

  /**
   * render the modal mask when searching
   * @returns {XML}
   * @private
   */
  // _renderMask() {
  //   const { isSearching, searchStr } = this.state;
  //   if (isSearching && !searchStr) {
  //     return (
  //       <TouchableOpacity
  //         onPress={this.cancelSearch}
  //         style={[
  //           { top: this.props.toolbarHeight + Theme.size.searchInputHeight },
  //           // styles.maskStyle
  //         ]}>
  //         {/* <Animated.View /> */}
  //       </TouchableOpacity>
  //     );
  //   }
  // }

  // /**
  //  * render back button on the Toolbar
  //  * @returns {XML}
  //  * @private
  //  */
  // _renderBackButton() {
  //   return (
  //     <Touchable onPress={this.props.onPress}>
  //       <Image
  //         hitSlop={{ top: 10, left: 20, bottom: 10, right: 20 }}
  //         style={[
  //           {
  //             width: 20,
  //             height: 20,
  //             paddingLeft: 15,
  //             paddingRight: 15
  //           }
  //         ]}
  //         source={require('./images/icon-back.png')}
  //       />
  //     </Touchable>
  //   );
  // }

  // /**
  //  * render Toolbar
  //  * @returns {XML}
  //  * @private
  //  */
  // _renderToolbar() {
  //   const {
  //     title,
  //     titleTextColor,
  //     renderBackButton,
  //     renderRightButton,
  //     renderToolbar,
  //     toolbarHeight,
  //     toolbarBackgroundColor,
  //     statusBarHeight
  //   } = this.props;
  //   const { animatedValue } = this.state;

  //   return renderToolbar ? (
  //     renderToolbar()
  //   ) : (
  //     <Toolbar
  //       animatedValue={animatedValue}
  //       style={[
  //         {
  //           opacity: animatedValue.interpolate({
  //             inputRange: [0, 1],
  //             outputRange: [1, 0]
  //           }),
  //           backgroundColor: toolbarBackgroundColor,
  //           height: toolbarHeight,
  //           paddingTop: statusBarHeight
  //         }
  //       ]}
  //       title={title}
  //       textColor={titleTextColor}
  //       renderBackButton={renderBackButton || this._renderBackButton.bind(this)}
  //       renderRightButton={renderRightButton}
  //     />
  //   );
  // }

  /**
   * render the alphabetical index
   * @returns {*}
   * @private
   */
  _renderSectionIndex() {
    const {
      hideSectionList,
      toolbarHeight,
      sectionIndexContainerStyle,
      renderSectionIndexItem
    } = this.props;
    const { isSearching, sectionIds, animatedValue } = this.state;

    if (isSearching) {
      return null;
    }

    if (hideSectionList) {
      return null;
    }
    return (
      <View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: toolbarHeight,
            flexDirection: 'column',
            justifyContent: 'center'
          },
          sectionIndexContainerStyle
        ]}>
        <SectionIndex
          style={{
            opacity: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0]
            })
          }}
          onSectionSelect={this.scrollToSection}
          sections={sectionIds}
          renderSectionItem={renderSectionIndexItem || this._renderSectionIndexItem.bind(this)}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  rowSeparator: {
    backgroundColor: '#ffffff',
    paddingLeft: 16
  },
  rowSeparatorHide: {
    opacity: 0.0
  },
  sectionHeader: {
    flex: 1,
    height: Theme.size.sectionHeaderHeight,
    justifyContent: 'center',
    paddingLeft: 25,
    backgroundColor: '#fafafa',
    borderColor: '#E0E0E0',
    borderBottomWidth: 0.5,
    borderTopWidth: 0.5
  },
  sectionTitle: {
    color: '#979797',
    fontSize: 14
  },
  separator2: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    height: 1 / PixelRatio.get(),
    marginVertical: 1
  },
  maskStyle: {
    position: 'absolute',
    // top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Theme.color.maskColor,
    zIndex: 999
  },
  scrollSpinner: {
    ...Platform.select({
      android: {
        height: Theme.size.searchInputHeight
      },
      ios: {
        marginVertical: 40
      }
    })
  },
  emptyDataSource: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 50
  },
  searchMain: {
    paddingLeft: 16,
    paddingRight: 16
  },
  searchMainLabel: {
    flexDirection: "row",
    flexWrap: 'wrap',
    maxHeight: 210,
    overflow: 'hidden',
  },
  searchLabelBox: {
      borderRadius: 4,
      backgroundColor: '#f2f2f2',
      marginRight: 10,
      marginTop: 10,
      height: 32,
      justifyContent: 'center',
  },
  searchLabelText: {
      fontSize: 15,
      color: '#000',
      paddingLeft: 18,
      paddingRight: 18,
  },
  noData: {
    height: 55,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  noDataTxt: {
      fontSize: 15,
      color: '#000',
      lineHeight: 21
  },
});
