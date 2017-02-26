## 扇贝单词助手
提供<我的词库>和<单词书>批量添加单词的功能

## 兼容性
- 支持 Chrome
- 其他未测试（可以帮我测试下哦）

## 功能
- 我的词库页面：超量提交
- 单词书页面：高级添加模式
- 单元页面：全选、超量提交

## 详细介绍

#### 我的词库页面：超量提交
突破每次最多提交10个单词的限制，无限制提交。
使用请点击 <超量提交> 按钮。

#### 单词书页面：高级添加模式
提供一步到位的 **批量添加单元、添加单词和修改注解** 的功能
通过点击悬浮于页面左下方的闪电按钮，打开控制窗口。
有一定使用难度，需要编写指定格式的JSON数据。

JSON数据格式如下
```
{ "lists": [
  { "name": "单元名",
    "description": "单元描述 (可为空",
    "words": [
      { "word": "单词", "definition": "注释 (可为空,即默认注释"}
  ]}
]}
```
lists 是存放单元的数组
words 是存放单词的数组
description, definition 这两个字段不是必要的，可以不写
definition 单词注释，不写该字段 或 值为空时，不会修改注释内容，即默认注释

示例JSON代码
```
{ "lists": [
  { "name": "单元1",
    "description": "单元描述1",
    "words": [
      { "word": "test", "definition": ""},
      { "word": "sky", "definition": ""},
      { "word": "cat", "definition": "猫"}
  ]},
  { "name": "单元2",
    "description": "单元描述2",
    "words": [
      { "word": "test", "definition": ""},
      { "word": "sky", "definition": ""},
      { "word": "cat", "definition": "猫"}
  ]},
  { "name": "单元3",
    "description": "单元描述3",
    "words": [
      { "word": "test", "definition": ""},
      { "word": "sky", "definition": ""},
      { "word": "cat", "definition": "猫"}
  ]}
]}
```

#### 单元页面：全选、超量提交
<全选> 按钮
提供 选中 or 取消选中 全部单词的功能。

 <超量提交> 按钮
解决每次只能提交1个单词的麻烦，实现批量提交单词。