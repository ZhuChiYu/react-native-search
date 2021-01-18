import AsyncStorage from '@react-native-async-storage/async-storage';

// 增加数据
export const addData = async (key, value) => {
    try {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
    // saving error
    }
}

// 删除数据
export const delData = async (key) => {
    try {
        await AsyncStorage.removeItem(key)
    } catch(e) {
      // error delete value
    }
}

// 查询数据
export const getData = async (key) => {
    try {
        const history = await AsyncStorage.getItem(key)
        return history != null ? JSON.parse(history) : null;
    } catch(e) {
      // error reading value
    }
}
// 数组删除一个或多个 index:从第几个开始 length:删除几个,默认为1,可不传
export function arrDelete(arr, index, length = 1) {
    let tempArr = arr;
    arr.splice(index, length);
    return tempArr;
}