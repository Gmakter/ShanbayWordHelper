var REVIEW_MODES = {
  preview: "preview",
  test: "review_test",
  review_again: "review_again"
}

function get_review_template_name(review) {
  var k = 'preview';
  var review_status = review.review_status;
  if (G.update_type == 'fresh') {
    if (G.test_mode == true) {
      k = 'test';
    }
    if (_.contains([0, 3], review_status) && review.retention >= 3) {
      if (review.level == 2 || (review.level == 0 && userinfo.get('level') != 1))
        k = 'test';
    }
  } else {
    k = 'review_again';
  }
  var review_tmpl_name = REVIEW_MODES[k];
  return review_tmpl_name;
}

function play_uk_us_audio(auto_play_mode, review) {
  switch (auto_play_mode) {
    case 2:
      play_valid_mp3(review.audio_addresses.uk);
      break;
    case 1:
      break;
    default:
      play_valid_mp3(review.audio_addresses.us);
      break;
  }
}
is_flash_detected = function() {
  if ($.browser.webkit)
    return true;
  if (navigator.mimeTypes && navigator.mimeTypes["application/x-shockwave-flash"]) {
    return true;
  } else if (document.all && (navigator.appVersion.indexOf("Mac") == -1)) {
    try {
      var xObj = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
      if (xObj) {
        return true;
        xObj = null;
      }
    } catch (e) {};
  }
  return false;
}

function get_url(name, d) {
  var url_str = URLS[name];
  if (url_str) {
    var url = $.tmpl(url_str, d).text();
  } else {
    var url = ""
  }
  return url
}
var URLS = {
  "update_status": "/review/status",
  "delete_learning": "/api/v1/bdc/learning/${learning_id}/",
  "batch_add": "/bdc/vocabulary/add/batch/"
}
var NO_AUTO_AUDIO = 1,
  AUDIO_UK = 2,
  AUDIO_US = 3;
auto_play_mode = NO_AUTO_AUDIO;
LIBRARY_TYPE = 'today';
if (typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  }
}

function start_spin(id) {
  var opts = {
    lines: 13,
    zIndex: 2e9,
    color: '#209E85',
    top: 'auto',
    left: 'auto'
  };
  var target = document.getElementById(id);
  var spinner = new Spinner(opts).spin(target);
  $('#' + id).show();
}

function stop_spin(id) {
  $('#' + id).html('');
}

function bind_learning_events() {
  $('.learning .speaker').unbind('click').click(function() {
    var audio_urls = [];
    audio_urls[0] = $(this).parent().parent().attr("audio_0");
    audio_urls[1] = $(this).parent().parent().attr("audio_1");
    play_mp3(audio_urls);
  });
  $('.learning .master').unbind('click').click(function() {
    var review_id = $(this).parents('.learning').attr('id').split('-')[1];
    var $d = $(this);
    $d.html('<span class="loading">&nbsp;</span>');
    resolveLearning(review_id, show_msg, $d);

    function show_msg(d) {
      $('#learning-' + review_id).find('.msg').show();
      $(d).hide();
      setTimeout(function() {
        $('#learning-' + review_id).fadeOut();
      }, 2000)
    }
  })
  $('.learning .set-not-hard').unbind('click').click(function() {
    var review_id = $(this).parents('.learning').attr('id').split('-')[1];
    var $d = $(this);
    $d.html('<span class="loading">&nbsp;</span>');
    setLearningReviewTimes(review_id, show_msg($d));

    function show_msg(d) {
      $('#learning-' + review_id).find('.msg').show();
      d.hide();
      setTimeout(function() {
        $('#learning-' + review_id).find('.msg').fadeOut();
        d.parent().parent().slideUp();
      }, 1000)
    }
  })
  $('.learning .fail').unbind('click').click(function() {
    var review_id = $(this).parents('.learning').attr('id').split('-')[1];
    var $d = $(this);
    $d.html('<span class="loading">&nbsp;</span>');
    failLearning(review_id, show_msg, $d);

    function show_msg(d) {
      $('#learning-' + review_id).find('.msg').show();
      $(d).hide();
      setTimeout(function() {
        $('#learning-' + review_id).find('.msg').fadeOut();
      }, 2000)
    }
  })
  $('.learning .delete').unbind('click').click(function() {
    var $delete_trigger = $(this);
    $delete_trigger.siblings('.delete-confirm').show().click(function() {
      var review_id = $(this).parents('.learning').attr('id').split('-')[1];
      var url = get_url("delete_learning", {
        "learning_id": review_id
      });
      var $d = $(this);
      $d.html('<span class="loading">&nbsp;</span>');
      $.ajax({
        url: url,
        type: 'DELETE',
        success: function(data) {
          $('#learning-' + review_id).find('.msg').show();
          $d.hide();
          setTimeout(function() {
            $('#learning-' + review_id).remove();
          }, 1000)
        }
      });
    });
  })
}

function learning_library_init() {
  var user_id = $('#library-type').attr('user_id');
  var url = "/api/v1/user/";
  $.get(url, function(res) {
    auto_play_mode = res.auto_play_mode;
    var hash = window.location.hash;
    if (hash) {
      if (hash.indexOf('_') != -1)
        hash = hash.slice(0, hash.indexOf('_'));
      library_type = hash.slice(1, hash.length);
    }
    fetch_learnings(library_type);
  });
}

function switch_library_type() {
  $('li.library-type').click(function() {
    var library_type = $(this).attr('data');
    fetch_learnings(library_type);
  });
}

function fetch_learnings(library_type) {
  start_spin('loading-spin');
  var active_type = 'li.library-type.' + library_type;
  $('.pagination').empty();
  $(active_type).siblings().removeClass('active');
  $(active_type).addClass('active');
  var header = '鎴戠殑璇嶅簱锛�';
  var type_name = $(active_type).text();
  header = header + type_name;
  $('#header').html(header);
  LIBRARY_TYPE = library_type;
  var hash = '#' + library_type;
  var url = "/api/v1/bdc/library/" + library_type + "/";
  paginate_items(url, hash, '#learning-item-tmpl', '.pagination', 'objects', undefined, bind_learning_events);
  $('#learnings-container').children().hide();
  $(hash).show();
  stop_spin('loading-spin');
}
$('#add-learnings-form').submit(function() {
  var form = $(this);
  var textarea = form.find('textarea');
  var url = form.find('actions').text();
  var words = textarea.val();
  form.find('.msg').hide();
  if ($.trim(words).length == 0) {
    $('#error1').show();
    textarea.focus();
    return false;
  }
  form.find('input[type=submit]').hide();
  form.find('.loading').show();
  $.getJSON(url, {
    words: words
  }, function(data) {
    form.find('input[type=submit]').show();
    form.find('.loading').hide();
    if (data.result > 0) {
      $('#error2').html(data.note).show();
      return false;
    }
    var notfound_words = data.notfound_words;
    if (notfound_words.length > 0) {
      $('.notfounds').show();
      $('.notfounds ul').html('');
      $.each(notfound_words, function(k, word) {
        $('.notfounds ul').append($('#added-failed_tmpl').tmpl({
          word: word
        }));
      });
    } else {
      $('.notfounds').hide();
    }
    var learning_dicts = data.learning_dicts;
    if (learning_dicts.length > 0) {
      $('.learnings').show();
      $('.learnings ul').html('');
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
      $('.speaker').click(function() {
        var audio_urls = [];
        audio_urls[0] = $(this).parent().parent().attr("audio_0");
        audio_urls[1] = $(this).parent().parent().attr("audio_1");
        play_mp3(audio_urls);
      });
    } else {
      $('.learnings').hide();
    }
    textarea.focus().val('');
  })
  return false;
});

function bind_spotcheck_operation() {
  $('#spotcheck-select-all').click(function() {
    $('#spotcheck-invert-selection').attr('checked', false);
    if ($(this).attr('checked') === undefined) {
      $('#spotcheck-test input.word').attr('checked', false);
    } else {
      $('#spotcheck-test input.word').attr('checked', true);
    }
  });
  $('#spotcheck-invert-selection').click(function() {
    $('#spotcheck-select-all').attr('checked', false);
    var length = $('#spotcheck-test input.word').length;
    var i;
    for (i = 0; i < length; i++) {
      if ($('#spotcheck-test input.word').eq(i).attr('checked') === undefined) {
        $('#spotcheck-test input.word').eq(i).attr('checked', true);
      } else {
        $('#spotcheck-test input.word').eq(i).attr('checked', false);
      }
    }
  });
  $('#spotcheck-test input.word').click(function() {
    $('#spotcheck-invert-selection').attr('checked', false);
    $('#spotcheck-select-all').attr('checked', false);
  });
  $('#submit-spotcheck').click(function() {
    var ids = ""
    $("#spotcheck-test input.word:checked").each(function() {
      var id = $(this).attr('value') + ',';
      ids = ids + id;
    });
    if (ids.length > 0)
      ids = ids.substring(0, ids.length - 1)
    var url = "/api/v1/bdc/spotcheck/";
    $.post(url, data = {
      'ids': ids
    }, function(res) {
      if (res.status_code == 0) {
        window.location.href = "/bdc/spotcheck/success";
      } else {
        window.location.href = "/bdc/spotcheck/fail";
      }
    });
  });
}
resolveLearning = function(learning_id, callback, params) {
  $.ajax({
    url: '/api/v1/bdc/learning/' + learning_id + '/',
    type: 'PUT',
    data: {
      pass: 1,
      force: 1
    },
    success: function(data) {
      callback.apply(undefined, params);
    }
  });
}
failLearning = function(learning_id, callback, params) {
  $.ajax({
    url: '/api/v1/bdc/learning/' + learning_id + '/',
    type: 'PUT',
    data: {
      retention: 0
    },
    success: function() {
      callback.apply(undefined, params)
    }
  });
}
setLearningReviewTimes = function(learning_id, callback, params) {
  $.ajax({
    url: '/api/v1/bdc/review_times/' + learning_id + '/',
    type: 'PUT',
    success: function(data) {
      if (callback) {
        callback.apply(undefined, params);
      }
    }
  });
}

function start_spotcheck() {
  var url = "/api/v1/bdc/spotcheck/";
  $.get(url, function(res) {
    var html = $('#spotcheck-tmpl').tmpl({
      'vocabularies': res.data
    });
    $('#spotcheck-body-left').html(html);
    bind_spotcheck_operation();
  });
}

function clean_persional_vocabulary() {
  $('#chargeModal').hide();
  $('#cleanVocabulary').click(function() {
    var cleanFee = 2000;
    var url = "/api/v1/coins/useraccount/";
    $.get(url, function(res) {
      var balance = res.data.balance;
      $('#user_fortune').text(balance);
      if (balance >= cleanFee) {
        $('#pay-and-clean').show();
      } else {
        $('#recharge').show();
      }
    });
  });
  $('#recharge').click(function() {
    location.href = "/coins/charge/";
  });
  $('#pay-and-clean').click(function(res) {
    $('#pay-and-clean').hide();
    $('#processing').show();
    $.ajax({
      url: '/api/v1/bdc/user_vocabulary/',
      type: 'PUT',
      success: function(data) {
        $('#processing').hide();
        if ("SUCCESS" === data.msg) {
          $('#finish').show();
        } else {
          $('#not-finished').show();
        }
      }
    });
  });
  $('#chargeModal').on('hidden.bs.modal', function(e) {
    $('#finish').hide();
    $('#not-finished').hide();
    $('#processing').hide();
  });
  $('#finish').click(function() {
    location.reload();
  });
}