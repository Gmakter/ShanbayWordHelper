var SUCCESS_STATUS = 0;
var FAIL_STATUS = 1;
var SUBSCRIBE_WORDBOOK_SUCCESS = 0;
var SUBSCRIBE_WORDBOOK_SUBSCRIBED = 1;
var SUBSCRIBE_WORDBOOK_IN_SUFFICIENT_COINS = 2;
var SUBSCRIBE_WORDBOOK_IN_SUFFICIENT_PROGESS = 3;
var MIN_TITLE_LENGTH = 5;
var MIN_DESCRIPTION_LENGTH = 50;

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
$.ajaxSetup({
  cache: false
});
$('.edit-wordbook-cover').unbind('click').click(function() {
  $(this).hide();
  $(this).next().show();
});
$('.btn-cancel-change-wordbook-cover').unbind('click').click(function() {
  $(this).parent().hide();
  $(this).parent().prev().show();
});
$('.btn-change-wordbook-cover-submit').click(function() {
  var cover_image = $(this).parent().find('.cover-image');
  if (cover_image.val() == false) {
    alert($('#wordbook-empty-cover').html());
    return false;
  }
});
$("#wordbook-unsave-button").click(function() {
  $(this).attr('disabled', 'disabled');
  var wordbook_id = $('#wordbook-id-html').html();
  $.get('/wordbook/unsubscribe/' + wordbook_id + '/', {}, function(data) {
    var wordlist_ids = data.wordlist_ids;
    if (data.status == SUCCESS_STATUS) {
      $('#wordbook-unsave-div').slideUp('slow');
      $('.wordbook-saving-hint').slideDown('slow');
      $('.wordbook-saving-hint').slideUp('slow');
      $('#wordbook-save-div').slideDown('slow');
      $('#wordbook-save-button').removeAttr('disabled');
    } else {
      alert($('#wordbook-subscribe-failed').html());
    }
  }, 'json');
  $(this).removeAttr('disabled');
});
$('#wordbook-save-button').click(function() {
  $(this).attr('disabled', 'disabled');
  var wordbook_id = $('#wordbook-id-html').html();
  $('#wordbook-save-div').slideUp('slow');
  $('.wordbook-saving-hint').slideDown('slow');
  $.ajax({
    url: '/api/v1/wordbook/userwordbook/update/',
    data: {
      wordbook_id: wordbook_id,
      action: 'subscribe'
    },
    type: 'PUT',
    success: function(data) {
      if (data.status_code == 0) {
        $('.wordbook-in-sufficient-coins-hint').hide();
        $('.wordbook-saving-hint').slideUp('slow');
        $('#wordbook-unsave-div').slideDown('slow');
      } else {
        $('.wordbook-saving-hint').slideUp('slow');
        $('.wordbook-in-sufficient-coins-hint').slideDown('slow');
      }
    }
  });
  $(this).removeAttr('disabled');
});
var highlight_wordbook_category = function() {
  wordbook_id = $('#current-category-id').text();
  var category_selector = 'ul#wordbook-category-list li[data="' + wordbook_id + '"]';
  $(category_selector).addClass('active');
};
var submit_wordbook = function() {
  $('.wordbook-submit-button').click(function() {
    var wordbook_id = $('#wordbook-id-html').text();
    var html = $('#submit-wordbook-modal-tmpl').tmpl();
    $('#submit-wordbook-modal-container').html(html);
    $('#submit-wordbook-modal-container .modal').modal();
    start_spin('check-verification-requirements-loading');
    var submition_url = '/api/v1/wordbook/submit/?wordbook_id=' + wordbook_id;
    var already_paid = false;
    var qualified = true;
    $.get(submition_url, function(res) {
      stop_spin('check-verification-requirements-loading');
      $('#submit-wordbook-modal-container .modal-body-loading').hide();
      $('#submit-wordbook-modal-container .modal-footer-loading').hide();
      _.each(res.data, function(v, k) {
        if (k == 'already_paid') {
          already_paid = true;
        }
        qualified &= v;
        c = v ? 'icon-ok' : 'icon-remove';
        $('#submit-wordbook-modal-container .modal-body-top .' + k).find('i').addClass(c);
      });
      if (already_paid) {
        $('.charge-hint').hide();
        $('.already-paid-hint').show();
      }
      $('#submit-wordbook-modal-container .modal-body-top').show();
      $('#submit-wordbook-modal-container .modal-footer-top').show();
      $('#submit-wordbook-modal-container .modal-footer-bottom').hide();
      if (!qualified) {
        $('#submit-wordbook-modal-container .btn-submit-wordbook').attr('disabled', 'disabled');
      }
      $('#submit-wordbook-modal-container .modal-footer .btn-submit-wordbook').click(function() {
        if ($(this).attr('disabled') == 'disabled') {
          return false;
        }
        var data = {
          wordbook_id: wordbook_id
        };
        $.post(submition_url, data, function(res) {
          $('#submit-wordbook-modal-container .modal-footer-top').hide();
          $('#submit-wordbook-modal-container .modal-footer-bottom').show();
          $('#submit-wordbook-modal-container .modal-body-top').hide();
          if (res.status_code == 0) {
            $('#submit-wordbook-modal-container .modal-body-bottom .modal-body-success').show();
          } else {
            $('#submit-wordbook-modal-container .modal-body-bottom .modal-body-fail').show();
          }
        });
      });
    });
  });
}
var verify_user_create_wordbook = function() {
  $('#wordbook-verify-agreebtn').click(function() {
    $('.wordbook-verify-comment').slideDown('fast');
    $('span.verify-result').html('agree');
    var placeholder = $('#wordbook-verify-msg-agree-placeholder').html();
    var verify_status = $('#wordbook-verify-agree-status').html();
    $('.wordbook-button-area').html(verify_status);
    $('.wordbook-verify-comment textarea').attr('placeholder', placeholder);
  });
  $('#wordbook-verify-refusebtn').click(function() {
    $('.wordbook-verify-comment').slideDown('fast');
    $('span.verify-result').html('refuse');
    var placeholder = $('#wordbook-verify-msg-refuse-placeholder').html();
    var verify_status = $('#wordbook-verify-refuse-status').html();
    $('.wordbook-button-area').html(verify_status);
    $('.wordbook-verify-comment textarea').attr('placeholder', placeholder);
  });
  $('.verify-wordbook-submit').click(function() {
    var result = $('span.verify-result').html();
    var reason = $('.wordbook-verify-comment textarea').val();
    process_wordbook_verification(result, reason);
  });
}

function notify_user(recipient, body, subject, wordbook_id) {
  var tail = "\n\n[浣滆€呬俊鎭痌({1}/user/list/{0}/)\n[鍗曡瘝涔︿俊鎭痌({1}/wordbook/{2})".format(recipient, location.origin, wordbook_id);
  console.log(tail);
  body += tail;
  $.post('/api/v1/message/', {
    recipient: recipient,
    body: body,
    subject: subject
  }, function(data) {
    return false;
  });
}

function process_wordbook_verification(result, reason) {
  var wordbook_id = $('.verify-wordbook-id').html();
  $.post('/wordbook/verify/process/', {
    result: result,
    wordbook_id: wordbook_id
  }, function(data) {
    if (data.status == SUCCESS_STATUS) {
      $('.wordbook-verify-comment').slideUp('fast');
      var recipient = $('.wordbook-owner .wordbook-owner-username').html();
      var msg_subject = $('#wordbook-verify-msg-subject').html();
      if (data.result == 'agree') {
        var msg_agree = $('#wordbook-verify-msg-agree').html();
        var body = msg_agree + '鈥�' + reason + '鈥�';
        notify_user(recipient, body, msg_subject, wordbook_id);
        setTimeout('location.reload();', 1000);
      } else {
        var msg_refuse_head = $('#wordbook-verify-msg-refuse-head').html();
        var msg_refuse_tail = $('#wordbook-verify-msg-refuse-tail').html();
        var body = msg_refuse_head + '鈥�' + reason + '鈥�' + msg_refuse_tail;
        notify_user(recipient, body, msg_subject, wordbook_id);
        setTimeout('location.reload();', 1000);
      }
    }
  }, 'json');
}

function modify_wordbook_basic_info() {
  $('#modify-wordbook-fail').hide();
  var wordbook_id = $('#wordbook-id').text();
  var url = '/wordbook/verify/modify/' + wordbook_id + '/';
  $('#wordbook-basic-info-modal').modal();
  $('#wordbook-basic-info-modal .btn-primary').click(function() {
    var title = $('#wordbook-basic-info-modal #modify-wordbook-title').val();
    var description = $('#wordbook-basic-info-modal #modify-wordbook-description').val();
    var category = $('#wordbook-basic-info-modal #modify-wordbook-category').val()
    $.post(url, {
      'title': title,
      'description': description,
      'category': category
    }, function(data) {
      if (data.status == 0) {
        location.reload();
      } else {
        $('#modify-wordbook-fail').show();
      }
    });
  });
}

function trigger_modify_wordbook_publish_status() {
  $('.edit-wordbook-publish-status').unbind('click').click(function() {
    var wordbook_id = $(this).attr('data');
    var wordbook_status = $(this).attr('status');
    var recipient = $(this).parent().find('.author').text();
    var wordbook_title = $(this).parent().find('.wordbook-title').text();
    $('#wordbook-id').html(wordbook_id);
    $('#wordbook-publish-status-modal').modal();
    $('#wordbook-publish-status-modal #modify-wordbook-publish-status option[value=' + wordbook_status + ']').attr('selected', true);
    var wordbook_status_name = $('#wordbook-publish-status-modal #modify-wordbook-publish-status option[value=' + wordbook_status + ']').html();
    $('#wordbook-publish-status-modal .wordbook-current-status').html(wordbook_status_name);
    $('#wordbook-publish-status-modal .btn-primary').unbind('click').click(function() {
      $(this).attr('disabled', true);
      var wordbook_id = $('#wordbook-id').text();
      var publish_status = $('#wordbook-publish-status-modal #modify-wordbook-publish-status').val()
      var msg = $('#modify-wordbook-publish-status-msg').val();
      var url = '/wordbook/manage/update_status/' + wordbook_id + '/' + publish_status + '/';
      $.get(url, function(data) {
        if (data.status == 0) {
          var body = $('#wordbook-status-change-msg-top').text() + wordbook_title + $('#wordbook-status-change-msg-middle').text() + msg + $('#wordbook-status-change-msg-bottom').text();
          var subject = $('#wordbook-status-change-msg-subject').text();
          notify_user(recipient, body, subject, wordbook_id);
          setTimeout('location.reload();', 1000);
        } else {
          alert("Sever Error, please try again later");
        }
      });
      $(this).attr('disabled', false);
    });
  });
}

function trigger_modify_wordbook_basic_info() {
  $('#edit-wordbook-basic-info').click(function() {
    var wordbook_title = $('.wordbook-title a').text().trim();
    var wordbook_description = $('.wordbook-description div').text().trim();
    $('#wordbook-basic-info-modal #modify-wordbook-title').val(wordbook_title);
    $('#wordbook-basic-info-modal #modify-wordbook-description').val(wordbook_description);
    modify_wordbook_basic_info();
  });
}

function trigger_edit_wordbook_basic_info() {
  $('.edit-wordbook-basic-info').unbind('click').click(function() {
    var wordbook_title = $(this).parent().find('.wordbook-title').text();
    var wordbook_description = $(this).parent().find('.wordbook-description').text();
    var wordbook_id = $(this).attr('data');
    $('#wordbook-basic-info-modal #modify-wordbook-title').val(wordbook_title);
    $('#wordbook-basic-info-modal #modify-wordbook-description').val(wordbook_description);
    $('#wordbook-id').html(wordbook_id);
    modify_wordbook_basic_info();
  });
}

function verify_wordbook_title_length() {
  $('.wordbook-basicinfo-submit-btn').click(function() {
    var title_length = $('#id_title').val().length;
    var description_length = $('#id_description').val().trim().length;
    if (title_length < MIN_TITLE_LENGTH || description_length < MIN_DESCRIPTION_LENGTH) {
      if (title_length < MIN_TITLE_LENGTH) {
        alert($('#wordbook-title-invalid-length-hint').html());
      } else {
        alert($('#wordbook-description-invalid-length-hint').html());
      }
      return false;
    }
  });
}

function verify_wordbook_cover() {
  $('#wordbook-cover-upload-button').click(function() {
    if ($('#cover-image').val() == false) {
      alert($('#wordbook-empty-cover').html());
      return false;
    }
  });
}

function create_wordbook_add_wordlist() {
  $(".create-wordbook-add-wordlist-btn").unbind('click').click(function() {
    var wordlist_id = $(this).attr('data-id');
    var wordbook_id = $('#wordbook-id-html').html();
    var parent_dom = $(this).parent();
    parent_dom.html($('#manipulate-wordlist-waiting-hint').html());
    $.post('/wordbook/add/wordlist/', {
      wordlist_id: wordlist_id,
      wordbook_id: wordbook_id
    }, function(data) {
      if (data.status == 0) {
        $('#remove-wordlist-button button').attr("data-id", wordlist_id);
        parent_dom.html($('#remove-wordlist-button').html());
        parent_dom.parent().find('span.badge').show();
        create_wordbook_remove_wordlist();
      } else {
        parent_dom.html($('#manipulate-wordlist-error-hint').html());
      }
    }, 'json');
  });
}

function create_wordbook_remove_wordlist() {
  $(".create-wordbook-remove-wordlist-btn").unbind('click').click(function() {
    var wordlist_id = $(this).attr('data-id');
    var wordbook_id = $('#wordbook-id-html').html();
    var parent_dom = $(this).parent();
    parent_dom.html($('#manipulate-wordlist-waiting-hint').html());
    $.post('/wordbook/remove/wordlist/', {
      wordlist_id: wordlist_id,
      wordbook_id: wordbook_id
    }, function(data) {
      if (data.status == 0) {
        $('#add-wordlist-button button').attr("data-id", wordlist_id);
        parent_dom.html($('#add-wordlist-button').html());
        parent_dom.parent().find('span.badge').hide();
        create_wordbook_add_wordlist();
      } else {
        parent_dom.html($('#manipulate-wordlist-error-hint').html());
      }
    }, 'json');
  });
}

function trigger_change_wordbook_cover() {
  $('a#change-wordbook-cover').click(function() {
    $('#wordbook-cover-div').slideUp();
    $('#change-wordbook-cover-form').slideDown();
  });
}

function delete_user_wordbook() {
  $('.delete-wordbook a').click(function() {
    var a = confirm($('#delete-confirm-prompt').html());
    if (a) {
      var this_dom = $(this);
      this_dom.hide();
      this_dom.parent().find('.delete-hint').show();
      var wordbook_id = $(this).attr('data-id');
      $.get('/wordbook/delete/' + wordbook_id + '/', {}, function(data) {
        this_dom.parent().find('.delete-hint').hide();
        if (data.status == SUCCESS_STATUS) {
          location.reload();
        } else {
          alert($('#delete-fail-prompt').html());
        }
      }, 'json');
    }
  });
}

function switch_to_wordlist_tab() {
  $("#wordlist-tab-trigger").click();
}

function switch_to_wordbook_tab() {
  $("#wordbook-tab-trigger").click();
}

function trigger_start_to_learn_wordbook_hint() {
  $(".btn-start-to-learn-wordbook").unbind('click').click(function() {
    var wordbook_title = $(this).parent().parent().find('.wordbook-title a').html();
    var next_url = $(this).attr("next");
    $("#start-to-learn-wordbook-hint-modal .gonna_learn_type").html("鍗曡瘝涔�");
    $("#start-to-learn-wordbook-hint-modal .gonna_learn").html(wordbook_title);
    $("#start-to-learn-wordbook-hint-modal .btn-primary").attr("href", next_url);
    $("#start-to-learn-wordbook-hint-modal").modal();
  });
}

function trigger_start_to_learn_wordlist_hint() {
  $(".btn-start-to-learn-wordlist").unbind('click').click(function() {
    var wordlist_title = $(this).parent().parent().find('.wordbook-wordlist-name a').html();
    var next_url = $(this).attr("next");
    $("#start-to-learn-wordbook-hint-modal .gonna_learn_type").html("璇嶄覆");
    $("#start-to-learn-wordbook-hint-modal .gonna_learn").html(wordlist_title);
    $("#start-to-learn-wordbook-hint-modal .btn-primary").attr("href", next_url);
    $("#start-to-learn-wordbook-hint-modal").modal();
  });
}
$('.wordbook-unsubscribe a').click(function() {
  var index = $('.wordbook-unsubscribe a').index($(this));
  $(this).hide();
  $(this).parent().children().eq(2).show();
  var wordbook_id = $(this).parent().children().eq(1).html();
  $.get('/wordbook/unsubscribe/' + wordbook_id + '/', function(data) {
    if (data.status == SUCCESS_STATUS) {
      window.location.reload();
    } else {
      alert("鍙栨秷鏀惰棌澶辫触锛岃绋嶅悗鍐嶈瘯");
    }
  }, 'json');
});

function refresh_create_button() {
  if ($('#wordbook-tab-trigger').parent().hasClass('active')) {
    $('.create-wordlist-btn-area').removeClass('hide');
    $('.create-wordbook-btn-area').addClass('hide');
  } else {
    $('.create-wordbook-btn-area').removeClass('hide');
    $('.create-wordlist-btn-area').addClass('hide');
  }
}
$('#wordbook-wordlist-switcher li').click(refresh_create_button);

function init_create_button() {
  if ($('#wordbook-tab-trigger').parent().hasClass('active')) {
    $('.create-wordbook-btn-area').removeClass('hide');
    $('.create-wordlist-btn-area').addClass('hide');
  } else {
    $('.create-wordlist-btn-area').removeClass('hide');
    $('.create-wordbook-btn-area').addClass('hide');
  }
}

function enable_update_wordbook_weight() {
  function trigger_show_update_wordbook_weight() {
    $(this).hide();
    $(this).next().show();
  }

  function trigger_hide_update_wordbook_weight() {
    $(this).parent().hide();
    $(this).parent().prev().show();
  }
  $('.btn-show-update-wordbook-weight').click(trigger_show_update_wordbook_weight);
  $('.update-wordbook-weight .btn-cancel').click(trigger_hide_update_wordbook_weight);
  $('.update-wordbook-weight .btn-submit').click(function() {
    var this_dom = $(this);
    this_dom.attr('disabled', true);
    var wordbook_id = this_dom.attr('data');
    var weight = this_dom.parent().find('input').val()
    url = '/wordbook/manage/update_weight/' + wordbook_id + '/' + weight + '/';
    $.get(url, function(data) {
      this_dom.parent().parent().find('.btn-show-update-wordbook-weight').html(weight);
      this_dom.prev().click();
      this_dom.attr('disabled', false);
    });
  });
}
$('.btn-reset-wordbook').click(function() {
  var html = $('#reset-wordbook-confirm-modal-tmpl').tmpl();
  var wordbook_id = $('#wordbook-id-html').text();
  var reset_url = '/api/v1/wordbook/reset/' + wordbook_id + '/';
  $('#reset-wordbook-confirm-modal-container').html(html);
  $('#reset-wordbook-confirm-modal-container .modal').modal();
  $('#reset-wordbook-confirm-modal-container .btn-submit-reset').click(function() {
    $.ajax({
      url: reset_url,
      type: 'PUT',
      success: function(res) {
        $('#reset-wordbook-confirm-modal .modal-body-top').hide();
        $('#reset-wordbook-confirm-modal .modal-footer-top').hide();
        $('#reset-wordbook-confirm-modal .modal-footer-bottom').show();
        if (res.status_code == 0) {
          $('#reset-wordbook-confirm-modal .modal-body-bottom').show();
          $('#reset-wordbook-confirm-modal .btn-close-modal').click(function() {
            location.reload();
          });
        } else {
          switch (res.data.status) {
            case 0:
              break;
            case 1:
              $('#reset-wordbook-confirm-modal .modal-body-no-book').show();
              $('#reset-wordbook-confirm-modal .btn-close-modal').attr('data-dismiss', 'modal');
              break;
            case 2:
              $('#reset-wordbook-confirm-modal .modal-body-no-shells').show();
              $('#reset-wordbook-confirm-modal .btn-close-modal').attr('data-dismiss', 'modal');
              break;
            case 3:
              $('#reset-wordbook-confirm-modal .modal-body-no-words').show();
              $('#reset-wordbook-confirm-modal .btn-close-modal').attr('data-dismiss', 'modal');
              break;
            case 4:
              $('#reset-wordbook-confirm-modal .modal-body-time-limit').show();
              $('#reset-wordbook-confirm-modal .btn-close-modal').attr('data-dismiss', 'modal');
              break;
          }
        }
      }
    });
  });
});
$('.btn-add-new-unit').click(function() {
  var wordbook_id = $('#wordbook-id-html').text();
  var html = $('#wordbook-unit-modal-tmpl').tmpl();
  $('#wordbook-unit-modal-container').html(html);
  $('#wordbook-unit-modal .modal').modal();
  $('#wordbook-unit-modal .btn-submit-unit-creation').click(function() {
    var url = '/api/v1/wordbook/wordlist/';
    if (form_is_valid()) {
      data = $('.unit-form').serialize();
      $.post(url, data, function(res) {
        $('#wordbook-unit-modal .modal-body-top').hide();
        $('#wordbook-unit-modal .modal-footer-top').hide();
        $('#wordbook-unit-modal .modal-footer-bottom').show();
        if (res.status_code == 0) {
          $('#wordbook-unit-modal .modal-body-bottom .modal-body-success').show();
          var data = {
            'wordlist': res.data.wordlist,
            'id': res.data.id,
            'wordbook_id': wordbook_id
          };
          var html = $('#wordbook-wordlist-tmpl').tmpl(data);
          if ($('.wordbook-create-candidate-wordlist:last').length == 0) {
            $('#wordbook-wordlist-container').html(html);
          } else {
            $(html).insertAfter($('.wordbook-create-candidate-wordlist:last'));
          }
          init_unit_editing();
        } else {
          $('#wordbook-unit-modal .modal-body-bottom .modal-body-fail').show();
        }
      });
    } else {
      $('#wordbook-unit-modal .modal-body-top .invalid-form-hint').show();
    }
  });

  function form_is_valid() {
    var name = $('#id_name').val();
    var desc = $('#id_description').val();
    var w_id = $('#id_wordbook_id').val()
    if (name.length > 0 & desc.length > 0 & w_id.length > 0) {
      return true;
    }
    return false;
  }
});

function init_unit_editing() {
  $('.btn-update-unit-info').unbind('click').click(function() {
    var unit_id = $(this).attr('unit-id');
    var id = $(this).attr('id');
    var desc = $(this).attr('desc');
    var name = $('#wordlist-' + id).find('.wordbook-wordlist-name a').text();
    var html = $('#wordbook-unit-modification-modal-tmpl').tmpl();
    $('#wordbook-unit-modification-modal-container').html(html);
    fillin_unit_info(name, desc);
    $('#wordbook-unit-modification-modal-container .modal').modal();

    function fillin_unit_info(name, desc) {
      $('#wordbook-unit-modification-modal-container #id_name').val(name);
      $('#wordbook-unit-modification-modal-container #id_description').val(desc);
    }
    $('#wordbook-unit-modification-modal-container .btn-submit-unit-modification').click(function() {
      var data = $('#wordbook-unit-modification-modal-container form').serialize();
      var url = '/api/v1/wordlist/' + unit_id;
      $.ajax({
        type: "PUT",
        url: url,
        data: data
      }).done(function(res) {
        $('#wordbook-unit-modification-modal-container .modal-body-top').hide();
        $('#wordbook-unit-modification-modal-container .modal-footer-top').hide();
        $('#wordbook-unit-modification-modal-container .modal-footer-bottom').show();
        if (res.status_code == 0) {
          $('#wordbook-unit-modification-modal-container .modal-body-bottom .modal-body-success').show();
          $('#wordlist-' + id).find('.wordbook-wordlist-name a').text(res.data.name);
        } else {
          $('#wordbook-unit-modification-modal-container .modal-body-bottom .modal-body-fail').show();
        }
      });
    });
  });
  $('.btn-delete-unit').unbind('click').click(function() {
    var unit_id = $(this).attr('unit-id');
    var html = $('#wordbook-unit-deletion-modal-tmpl').tmpl();
    $('#wordbook-unit-deletion-modal-container').html(html);
    $('#wordbook-unit-deletion-modal .modal').modal();
    $('#wordbook-unit-deletion-modal .btn-submit-unit-deletion').click(function() {
      var url = '/api/v1/wordbook/wordlist/' + unit_id;
      $.ajax({
        type: "DELETE",
        url: url
      }).done(function(res) {
        $('#wordbook-unit-deletion-modal .modal-body-top').hide();
        $('#wordbook-unit-deletion-modal .modal-footer-top').hide();
        $('#wordbook-unit-deletion-modal .modal-footer-bottom').show();
        if (res.status_code == 0) {
          $('#wordbook-unit-deletion-modal .modal-body-bottom .modal-body-success').show();
          $('#wordlist-' + unit_id).remove();
        } else {
          $('#wordbook-unit-deletion-modal .modal-body-bottom .modal-body-fail').show();
        }
      });
    });
  });
  $('.btn-move-unit').unbind('click').click(function() {
    function fillin_unpublished_wordbooks() {
      var url = '/api/v1/wordbook/?status=unpublished';
      $.get(url, function(res) {
        var wordbooks = res.data;
        wordbooks = _.filter(wordbooks, function(w) {
          return w.id != wordbook_id
        })
        var html = $('#move-wordbook-unit-modal-tmpl').tmpl({
          'wordbooks': wordbooks
        });
        $('#move-wordbook-unit-modal-container').html(html);
        $('#move-wordbook-unit-modal .modal').modal();
        $('#move-wordbook-unit-modal .btn-submit-move-unit').click(function() {
          var url = '/api/v1/wordbook/wordlist/';
          var new_wordbook_id = $('#new-wordbook-id').val()
          var data = {
            'wordbook_id': wordbook_id,
            'wordlist_id': unit_id,
            'new_wordbook_id': new_wordbook_id
          }
          $.ajax({
            type: "PUT",
            url: url,
            data: data
          }).done(function(res) {
            $('#move-wordbook-unit-modal .modal-body-top').hide();
            $('#move-wordbook-unit-modal .modal-footer-top').hide();
            $('#move-wordbook-unit-modal .modal-footer-bottom').show();
            if (res.status_code == 0) {
              $('#move-wordbook-unit-modal .modal-body-bottom .modal-body-success').show();
              $('#wordlist-' + id).remove();
            } else {
              $('#move-wordbook-unit-modal .modal-body-bottom .modal-body-fail').show();
            }
          });
        });
      });
    }
    var unit_id = $(this).attr('unit-id');
    var id = $(this).attr('data');
    var wordbook_id = $('#wordbook-id-html').text();
    fillin_unpublished_wordbooks();
  });
}
$('.search-wordbooks-form').submit(function search_wordbooks() {
  var $target = $(this).find('input');
  if (!$target.val())
    return false;
})
init_unit_editing()