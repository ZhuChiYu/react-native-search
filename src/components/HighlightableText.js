import React, { Component } from 'react';
import { Text } from 'react-native';
import PropTypes from 'prop-types';

export default class HighlightableText extends Component {
  static propTypes = {
    matcher: PropTypes.object,
    text: PropTypes.string.isRequired,
    textColor: PropTypes.string,
    hightlightTextColor: PropTypes.string
  };

  static defaultProps = {
    textColor: '#000',
    hightlightTextColor: '#000'
  };

  render() {
    // textStyle为默认文本样式，
    // choosenTextStyle为被选中的文本样式，
    // unchoosenTextStyle为未被选中的文本样式。
    const { textStyle, choosenTextStyle, unchoosenTextStyle } = this.props;
    let startIndex = 0;
    const titleContents = [];

    const key = 'key';
    const { text = '', matcher: { matches = [] } = {} } = this.props;

    // 默认列表为
    if(matches.length == 0){
      const str = text.slice(startIndex, text.length);;
      titleContents.push(
        <Text
          key={key + startIndex}
          style={[{
            fontSize: 16,
            color: '#000',
            opacity: 0.8
          }, textStyle]}>
          {str}
        </Text>
      );
    }else{
      for (const match of matches) {
        if (match && match.start > startIndex) {
          const endIndex = match.end > text.length ? text.length : match.end;
          // 当前位置和匹配起始位置之间的文字
          const str = text.slice(startIndex, match.start);
          titleContents.push(
            <Text
              key={key + startIndex}
              style={[{
                fontSize: 16,
                color: '#000',
                opacity: 0.4
              }, unchoosenTextStyle]}>
              {str}
            </Text>
          );
  
          // 被选中的文字
          const selStr = text.slice(match.start, endIndex);
          titleContents.push(
            <Text
              key={key + match.start}
              style={[{
                fontSize: 16,
                color: '#000',
                opacity: 0.8
              }, choosenTextStyle]}>
              {selStr}
            </Text>
          );
  
          startIndex = endIndex;
        } else if (match) {
          const endIndex = match.end > text.length ? text.length : match.end;
          // 被选中的文字
          const selStr = text.slice(startIndex, endIndex);
          titleContents.push(
            <Text
              key={key + startIndex}
              style={[{
                fontSize: 16,
                color: '#000',
                opacity: 0.8
              }, choosenTextStyle]}>
              {selStr}
            </Text>
          );
  
          startIndex = endIndex;
        }
      }
      // 剩余的文字
      if (startIndex < text.length) {
        const str = text.slice(startIndex, text.length);
        titleContents.push(
          <Text
            key={key + startIndex}
            style={[{
              fontSize: 16,
              color: '#000',
              opacity: 0.4
            }, unchoosenTextStyle]}
            numberOfLines={1}>
            {str}
          </Text>
        );
      }
    }
    return <Text style={{ flexDirection: 'row' }}>{titleContents}</Text>;
  }
}
