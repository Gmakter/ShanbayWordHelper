// ==UserScript==
// @name          扇贝单词助手
// @namespace     https://greasyfork.org/scripts/18488
// @description   提供<我的词库>和<单词书>批量添加单词的功能
// @author        ZSkycat
// @version       2.20160522
// @grant         none
// @include       *://www.shanbay.com/bdc/vocabulary/add/batch/
// @include       /^https{0,1}://www.shanbay.com/wordbook/\d+//
// @include       *://www.shanbay.com/wordlist/*
// ==/UserScript==

// 高级添加模式，支持批量添加单元、添加单词和修改注解
// 详细说明请查看 https://greasyfork.org/scripts/18488
/* JSON格式如下：
{ "lists": [
  { "name": "单元名",
    "description": "单元描述 (可为空",
    "words": [
      { "word": "单词", "definition": "注释 (可为空,即默认注释"}
  ]}
]}
*/

var debug_mode = true;
init();

//初始化
function init() {
  if (debug_mode)
    console.warn("debug!");
  if (!jQuery)
    return;
  //根据页面，启动对应模式
  if (window.location.href.indexOf('bdc') != -1 && $('#add-learnings-form').length != 0)
    init_library();
  else if (window.location.href.indexOf('wordbook') != -1 && $('.btn-add-new-unit').length != 0)
    init_wordbook();
  else if (window.location.href.indexOf('wordlist') != -1 && $('#to_add_vocabulary').length != 0)
    init_wordlist();
}

//初始化-个人词库模式
function init_library() {
  //超量提交
  $('#add-learnings-form input[type=submit]').after('<button id="shanbayhelper-library-batchadd" class="btn btn-warning" type="button" title="扇贝单词助手：突破10个单词限制" style="margin-left:10px;"><i class="icon-bolt"></i> 超量提交</button>');
  $('#add-learnings-form input[type=submit]').after('<div id="shanbayhelper-library-alert" class="alert alert-error" style="display: none;"></div>');
  var $text_word = $('#add-learnings-form textarea');
  var $alert = $('#shanbayhelper-library-alert');
  $('#shanbayhelper-library-batchadd').on('click', function() {
    //检测
    var temp = $text_word.val().trim();
    if (temp == '') return;
    //UI重置
    $text_word.val('');
    $('.notfounds').hide();
    $('.notfounds ul').html('');
    $('.learnings').hide();
    $('.learnings ul').html('');
    $alert.hide().html('');
    //数据处理
    var word = temp.split('\n');
    var words = [];
    var temp = '';
    for (var i = 0; i < word.length; i++) {
      temp = temp.concat('\n', word[i]);
      if (i != 0 && (i + 1) % 10 == 0 || (i + 1) == word.length) {
        words.push(temp);
        temp = '';
      }
    }
    for (var i = 0; i < words.length; i++) {
      add_library_word(words[i].trim(), add_success, add_error);
    }
  });
  //超量提交-成功回调
  function add_success(result) {
    if (result.result == 0) {
      //原页面的UI操作代码
      var notfound_words = result.notfound_words;
      if (notfound_words.length > 0) {
        $('.notfounds').show();
        $.each(notfound_words, function(k, word) {
          $('.notfounds ul').append($('#added-failed_tmpl').tmpl({
            word: word
          }));
        });
      }
      var learning_dicts = result.learning_dicts;
      if (learning_dicts.length > 0) {
        $('.learnings').show();
        $.each(learning_dicts, function(k, learning) {
          $('.learnings ul').append($('#added-learning_tmpl').tmpl({
            id: learning.id,
            pronunciation: learning.pronunciation,
            content: learning.content,
            has_audio: learning.has_audio,
            definition: learning.definition,
            uk_audio: learning.uk_audio,
            us_aduio: learning.us_audio
          }));
        });
        $('.speaker').off('click').click(function() {
          var audio_urls = [];
          audio_urls[0] = $(this).parent().parent().attr("audio_0");
          audio_urls[1] = $(this).parent().parent().attr("audio_1");
          play_mp3(audio_urls);
        });
      }
    } else {
      $alert.show();
      $alert.append('提交异常：' + result.note + '<br>');
      return false;
    }
  }
  //超量提交-失败回调
  function add_error(xhr, status) {
    $alert.show();
    $alert.append('提交异常：' + status + '<br>');
  }
}

//初始化-单词书模式
function init_wordbook() {
  //绘制界面
  $('body').append('<style>#shanbayhelper-mini{width:40px;height:40px;position:fixed;bottom:25px;left:25px;z-index:5;border-radius:50%;background-color:#17a086;text-align:center;opacity:.5;cursor:pointer;transition:all .25s ease-in-out}#shanbayhelper-mini>i{color:#fff;font-size:25px;line-height:40px}#shanbayhelper-mini:hover{opacity:1}#shanbayhelper-window{width:500px;position:fixed;bottom:25px;left:25px;z-index:10;padding:5px;border:1px solid #17a086;background-color:#ddd;font-size:14px}#shanbayhelper-head{padding-bottom:5px;border-bottom:1px solid #17a086}#shanbayhelper-body{overflow:auto;max-height:400px;padding:5px 0}#shanbayhelper-status>span{padding-right:25px}#shanbayhelper-foot{padding-top:5px;border-top:1px solid #17a086;text-align:right}#shanbayhelper-window .bold{font-weight:700}#shanbayhelper-window .green{color:#17a086}#shanbayhelper-window .orange{color:#e77e23}#shanbayhelper-window button{padding:0 5px;border:solid 1px #fff;background-color:#17a086;color:#fff;transition:all .25s ease-in-out}#shanbayhelper-window button:hover{border-color:#000;color:#000}#shanbayhelper-window textarea{padding:1px 3px;border-radius:0;border-color:#a9a9a9;margin:0;box-shadow:none;resize:vertical}</style><div id="shanbayhelper-mini" title="扇贝单词助手"><i class="icon-bolt"></i></div><div id="shanbayhelper-window" style="display: none;"><div id="shanbayhelper-head"><span class="green bold">【高级添加模式】</span><span>单词书：</span><span id="shanbayhelper-book" class="orange">null (0)</span></div><div id="shanbayhelper-body"><div><textarea id="shanbayhelper-textarea" placeholder="请输入JSON文本，或者上传JSON文件。（JSON格式请参阅脚本代码注释）" style="width: calc(100% - 8px);"></textarea><input id="shanbayhelper-file" type="file"><div><button id="shanbayhelper-btn-text" type="button">开始提交</button><button id="shanbayhelper-btn-file" type="button">读取文件</button></div></div><div id="shanbayhelper-status"><span>单元进度：<span id="shanbayhelper-count-list">0</span>/<span id="shanbayhelper-count-listmax">0</span></span><span>(<span id="shanbayhelper-listname">null</span>) 单词进度：<span id="shanbayhelper-count-word">0</span>/<span id="shanbayhelper-count-wordmax">0</span></span></div><div id="shanbayhelper-error" class="orange"></div></div><div id="shanbayhelper-foot"><span style="float: left;"><button id="shanbayhelper-btn-hide" type="button">隐藏</button></span><span><span class="green" style="padding-right: 25px;">扇贝单词助手</span><span>作者：</span><span class="green">ZSkycat</span></span></div></div>');
  //获取数据和元素
  var data_list_word = {};
  var count = {
    list: -1,
    listmax: 0,
    word: -1,
    wordmax: 0,
  };
  var wordbook_id = $('#wordbook-id-html').text();
  var $window = $('#shanbayhelper-window');
  var $console = $('#shanbayhelper-body>div:first-child');
  var $textarea = $('#shanbayhelper-textarea');
  var $file = $('#shanbayhelper-file');
  var $count_list = $('#shanbayhelper-count-list');
  var $count_listmax = $('#shanbayhelper-count-listmax');
  var $listname = $('#shanbayhelper-listname');
  var $count_word = $('#shanbayhelper-count-word');
  var $count_wordmax = $('#shanbayhelper-count-wordmax');
  var $error = $('#shanbayhelper-error');
  //显示单词书信息
  var temp = $('.wordbook-title').text().trim();
  $('#shanbayhelper-book').html(temp + ' (' + wordbook_id + ')');
  //窗口的显示隐藏
  $('#shanbayhelper-mini').on('click', function() {
    $window.show('normal');
  });
  $('#shanbayhelper-btn-hide').on('click', function() {
    $window.hide('normal');
  });
  //开始提交
  $('#shanbayhelper-btn-text').on('click', function() {
    //检测和JSON转换
    var temp;
    temp = $textarea.val().trim();
    if (temp == '') {
      show_error('JSON数据为空');
      return;
    }
    try {
      data_list_word = $.parseJSON(temp);
    } catch (e) {
      show_error('JSON数据转换对象失败：' + e);
      return;
    }
    if (!test_json()) return false;
    //UI处理
    $console.hide();
    $error.html('');
    //数据处理
    show_info('开始处理，耐心等待哦');
    set_listmax(data_list_word.lists.length);
    next_list();
  });
  //读取文件
  $('#shanbayhelper-btn-file').on('click', function() {
    var file = $file[0].files[0];
    if (file == null) {
      show_error('未选取文件');
      return;
    }
    if (file.size > 1048576) {
      show_error('文件太大超过1M，页面会崩掉的，是不是选错了');
      return;
    }
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function() {
      $textarea.val(this.result);
    };
    reader.onerror = function() {
      show_error('读取文件失败：' + file.name);
    };
  });
  //测试json数据格式是否正确
  function test_json() {
    if (!$.isArray(data_list_word.lists)) {
      show_error('JSON数据格式错误：不存在 lists 的数组');
      return false;
    }
    if (data_list_word.lists.length == 0) {
      show_error('JSON数据格式错误：lists 的长度为 0');
      return false;
    }
    for (var i = 0; i < data_list_word.lists.length; i++) {
      if (data_list_word.lists[i].name == null) {
        show_error('JSON数据格式错误：lists[' + i + '] 不存在 name 的字段');
        return false;
      }
      if (!$.isArray(data_list_word.lists[i].words)) {
        show_error('JSON数据格式错误：lists[' + i + '] 不存在 words 的数组');
        return false;
      }
    }
    return true;
  }
  //读取下一单元
  function next_list() {
    if (count.list < count.listmax - 1) {
      //延时提交
      window.setTimeout(function() {
        set_list(count.list + 1);
        set_word(-1);
        set_wordmax(data_list_word.lists[count.list].words.length);
        var temp = data_list_word.lists[count.list].description;
        if (temp == null || temp == '') temp = ' '; //description字段不能为空
        add_list(wordbook_id, data_list_word.lists[count.list].name, temp, addlist_success, addlist_error);
      }, 1000);
    } else {
      show_info('完成处理，请检查错误信息。如需再次使用请刷新页面');
    }
  }
  //添加单词
  function add_word() {
    for (var i = 0; i < count.wordmax; i++) {
      var dataCustom = i;
      add_list_word(data_list_word.lists[count.list].id, data_list_word.lists[count.list].words[i].word.trim(), addword_success, addword_error, dataCustom);
    }
  }
  //添加单元-成功回调
  function addlist_success(result) {
    if (result.status_code == 0) {
      //原页面的UI操作代码
      var data = {
        'wordlist': result.data.wordlist,
        'id': result.data.id,
        'wordbook_id': wordbook_id
      };
      var html = $('#wordbook-wordlist-tmpl').tmpl(data);
      if ($('.wordbook-create-candidate-wordlist:last').length == 0) {
        $('#wordbook-wordlist-container').html(html);
      } else {
        $(html).insertAfter($('.wordbook-create-candidate-wordlist:last'));
      }
      init_unit_editing();
      //添加单词
      data_list_word.lists[count.list].id = result.data.wordlist.id;
      add_word();
    } else {
      show_list_error(count.list, data_list_word.lists[count.list].name, result.msg);
      next_list();
    }
  }
  //添加单元-失败回调
  function addlist_error(xhr, status) {
    show_list_error(count.list, data_list_word.lists[count.list].name, status);
    next_list();
  }
  //添加单词-成功回调
  function addword_success(result) {
    if (result.status_code == 0) {
      var definition = data_list_word.lists[count.list].words[this.dataCustom].definition;
      if (definition == null || definition == '') {
        set_word(count.word + 1);
        if (count.word == count.wordmax - 1) next_list();
      } else {
        //编辑注释
        data_list_word.lists[count.list].words[this.dataCustom].id = result.data.vocabulary.id;
        edit_list_word_definition(data_list_word.lists[count.list].id, result.data.vocabulary.id, definition, editdef_success, editdef_error, this.dataCustom);
      }
    } else {
      show_word_error(count.list, data_list_word.lists[count.list].name, this.dataCustom, data_list_word.lists[count.list].words[this.dataCustom].word, result.msg);
      set_word(count.word + 1);
      if (count.word == count.wordmax - 1) next_list();
    }
  }
  //添加单词-失败回调
  function addword_error(xhr, status) {
    show_word_error(count.list, data_list_word.lists[count.list].name, this.dataCustom, data_list_word.lists[count.list].words[this.dataCustom].word, status);
    set_word(count.word + 1);
    if (count.word == count.wordmax - 1) next_list();
  }
  //编辑注释-成功回调
  function editdef_success(result) {
    if (result.status != 0) {
      show_definition_error(count.list, data_list_word.lists[count.list].name, this.dataCustom, data_list_word.lists[count.list].words[this.dataCustom].word, '发生异常');
    }
    set_word(count.word + 1);
    if (count.word == count.wordmax - 1) next_list();
  }
  //编辑注释-失败回调
  function editdef_error(xhr, status) {
    show_definition_error(count.list, data_list_word.lists[count.list].name, this.dataCustom, data_list_word.lists[count.list].words[this.dataCustom].word, status);
    set_word(count.word + 1);
    if (count.word == count.wordmax - 1) next_list();
  }
  //设置计数器，单元、单词
  function set_list(index) {
    count.list = index;
    $count_list.html(index + 1);
    $listname.html(data_list_word.lists[index].name);
  }

  function set_listmax(index) {
    count.listmax = index;
    $count_listmax.html(index);
  }

  function set_word(index) {
    count.word = index;
    $count_word.html(index + 1);
  }

  function set_wordmax(index) {
    count.wordmax = index;
    $count_wordmax.html(index);
  }
  //显示信息，异常，单元异常，单词异常，单词注释异常
  function show_info(info) {
    $error.append('<br><span class="green">' + info + '</span>');
  }

  function show_error(error) {
    $error.append('<br>' + error);
  }

  function show_list_error(list, listname, error) {
    $error.append('<br>[' + list + ']' + listname + '：' + error);
  }

  function show_word_error(list, listname, word, wordname, error) {
    $error.append('<br>[' + list + ']' + listname + '.[' + word + ']' + wordname + '：' + error);
  }

  function show_definition_error(list, listname, word, wordname, error) {
    $error.append('<br>[' + list + ']' + listname + '.[' + word + ']' + wordname + ' 注释：' + error);
  }
}

//初始化-单元模式
function init_wordlist() {
  var wordlist_id = $('#wordlist-id').text();
  //全选
  $('#delete-selected-vocabs').after('<button id="shanbayhelper-wordlist-allselect" class="btn btn-warning" type="button" title="扇贝单词助手：全选 / 全取消" style="margin-left:10px;" data-checked="false"><i class="icon-bolt"></i> 全选</button>');
  var $btn_allselect = $('#shanbayhelper-wordlist-allselect');
  $btn_allselect.on('click', function() {
    var checked = !$btn_allselect.data('checked');
    $('table.table input[type=checkbox]').each(function() {
      this.checked = checked;
    });
    $btn_allselect.data('checked', checked);
  });
  //超量提交
  $('table.table').before('<div id="shanbayhelper-wordlist-batchadd"><textarea placeholder="每个单词一行..." style="max-width:75%;min-height:100px;margin-right:10px;"></textarea><button class="btn btn-warning"type="button"title="扇贝单词助手"><i class="icon-bolt"></i> 超量提交</button><div class="alert alert-error" style="display: none;"></div></div>');
  var $text_word = $('#shanbayhelper-wordlist-batchadd>textarea');
  var $div_error = $('#shanbayhelper-wordlist-batchadd>div');
  $('#shanbayhelper-wordlist-batchadd>button').on('click', function() {
    //检测
    var temp = $text_word.val().trim();
    if (temp == '') return;
    //UI重置
    $text_word.val('');
    $div_error.hide().html('');
    //数据处理
    var words = temp.split('\n');
    for (var i = 0; i < words.length; i++) {
      var dataCustom = {
        index: i,
        word: words[i],
      };
      add_list_word(wordlist_id, words[i].trim(), add_success, add_error, dataCustom);
    }
  });
  //超量提交-成功回调
  function add_success(result) {
    if (result.status_code == 0) {
      //原页面的UI操作代码
      var html = $('#vocab-entry').tmpl(result.data);
      $('table tbody').prepend(html);
      trigger_add_example_modal();
      trigger_edit_definition_modal();
      enable_delete_button();
      update_wordlist_num_vocab(1);
    } else {
      $div_error.show();
      $div_error.append(this.dataCustom.index + ') ' + this.dataCustom.word + '：' + result.msg + '<br>');
    }
  }
  //超量提交-失败回调
  function add_error(xhr, status) {
    $div_error.show();
    $div_error.append(this.dataCustom.index + ') ' + this.dataCustom.word + '：' + status + '<br>');
  }
}

//增加单词库的单词
function add_library_word(words, callback_success, callback_error) {
  var data = {
    words: words
  };
  $.ajax({
    url: "/bdc/vocabulary/add/batch/",
    type: "get",
    data: data,
    dataType: 'json',
    success: callback_success,
    error: callback_error,
  });
}

//增加单元
function add_list(id, name, description, callback_success, callback_error) {
  var data = {
    'wordbook_id': id,
    'name': name,
    'description': description,
  };
  $.ajax({
    url: "/api/v1/wordbook/wordlist/",
    type: "post",
    data: data,
    dataType: 'json',
    success: callback_success,
    error: callback_error,
  });
}

//增加单元的单词
function add_list_word(id, word, callback_success, callback_error, dataCustom) {
  var data = {
    'id': id,
    'word': word,
  };
  $.ajax({
    url: "/api/v1/wordlist/vocabulary/",
    type: "post",
    data: data,
    dataType: 'json',
    dataCustom: dataCustom,
    success: callback_success,
    error: callback_error,
  });
}

//编辑单元的单词的注释
function edit_list_word_definition(wordlist_id, word_id, definition, callback_success, callback_error, dataCustom) {
  var data = {
    'wordlist_id': wordlist_id,
    'vocabulary_id': word_id,
    'definition': definition,
  };
  $.ajax({
    url: "/wordlist/vocabulary/definition/edit/",
    type: "post",
    data: data,
    dataType: 'json',
    dataCustom: dataCustom,
    success: callback_success,
    error: callback_error,
  });
}