import React, { Component } from 'react'
import {
  AppRegistry,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert
} from 'react-native'
import demoList from './data'
import SearchList from './src/SearchList'
import HighlightableText from './src/components/HighlightableText'
import Touchable from './src/utils/Touchable'

const rowHeight = 40
export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataSource: demoList
    }
  }

  // custom render row
  renderRow (item, sectionID, rowID, highlightRowFunc, isSearching) {
    return (
      <Touchable onPress={() => {
        Alert.alert('Clicked!', `sectionID: ${sectionID}; item: ${item.searchStr}`,
          [
            {text: 'OK', onPress: () => console.log('OK Pressed')}
          ],
          {cancelable: true})
      }}>
        <View key={rowID} style={{flex: 1, marginLeft: 20, height: rowHeight, justifyContent: 'center'}}>
          {/* use `HighlightableText` to highlight the search result */}
          <HighlightableText
            matcher={item.matcher}
            text={item.searchStr}
            textColor={'#000'}
            hightlightTextColor={'#0069c0'}
          />
        </View>
      </Touchable>
    )
  }

  // render empty view when datasource is empty
  renderEmpty () {
    return (
      <View style={styles.emptyDataSource}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> No Content </Text>
      </View>
    )
  }

  // render empty result view when search result is empty
  renderEmptyResult (searchStr) {
    return (
      <View style={styles.emptySearchResult}>
        <Text style={{color: '#979797', fontSize: 18, paddingTop: 20}}> No Result For <Text
          style={{color: '#171a23', fontSize: 18}}>{searchStr}</Text></Text>
        <Text style={{color: '#979797', fontSize: 18, alignItems: 'center', paddingTop: 10}}>Please search again</Text>
      </View>
    )
  }

  render () {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor='#F00' barStyle='light-content' />
        <SearchList
          data={this.state.dataSource}
          renderRow={this.renderRow.bind(this)}
          renderEmptyResult={this.renderEmptyResult.bind(this)}
          renderBackButton={() => null}
          renderEmpty={this.renderEmpty.bind(this)}

          rowHeight={rowHeight}

          toolbarBackgroundColor={'#ffffff'}
          cancelTitle='取消'
          cancelTextColor='#030303'
          onClickBack={() => {}}

          searchListBackgroundColor={'#2196f3'}

          searchBarToggleDuration={300}

          searchInputBackgroundColor={'#F2F2F2'}
          searchInputBackgroundColorActive={'#F2F2F2'}
          searchInputPlaceholderColor={'#FFF'}
          searchInputTextColor={'#000'}
          searchInputTextColorActive={'#000'}
          searchInputPlaceholder='请输入品牌名称'
          sectionIndexTextColor={'#000'}
          searchBarBackgroundColor={'#fff'}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efefef',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  },
  emptyDataSource: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 50
  },
  emptySearchResult: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: 50
  }
})

AppRegistry.registerComponent('App', () => App)