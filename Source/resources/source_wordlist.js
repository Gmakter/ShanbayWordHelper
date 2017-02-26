function trigger_add_vocabulary() {
  $('#to_add_vocabulary').keypress(function(e) {
    if (e.which == 13) {
      add_vocabulary();
    }
  });
}

function trigger_delete_vocabularies() {
  $('#delete-selected-vocabs').unbind('click').click(delete_vocabularies);
}

function trigger_unsave_wordlist() {
  $('#unsave-wordlist-btn').unbind('click').click(unsave_wordlist);
}

function trigger_delete_wordlist() {
  $('#delete-wordlist-btn').unbind('click').click(delete_wordlist);
}

function delete_wordlist() {
  $(this).attr('disabled', true);
  answer = confirm($("#delete-wordlist-confirm-hint").html());
  if (!answer) {
    $(this).attr('disabled', false);
    return false;
  }
}

function unsave_wordlist() {
  $(this).attr('disabled', true);
  var wordlist_id = $('#wordlist-id').html();
  var unsave_wordlist_url = '/wordlist/unsave/' + wordlist_id + '/';
  $.get(unsave_wordlist_url, function(data) {
    if (data.status == 0) {
      window.location.href = data.redirect_url;
    } else {
      window.location.href = "/review/new/";
    }
  });
}

function enable_delete_button() {
  $('input[type="checkbox"]:checked').attr('checked', false);
  $('input[type="checkbox"]').unbind('click').click(function() {
    if ($('input[type="checkbox"]:checked').length > 0) {
      $('#delete-selected-vocabs').attr('disabled', false);
    } else {
      $('#delete-selected-vocabs').attr('disabled', true);
    }
  });
}

function update_wordlist_num_vocab(delta) {
  var count = parseInt($('#wordlist-num-vocab').text()) + delta;
  $('#wordlist-num-vocab').html(count)
}

function add_vocabulary() {
  var url = '/api/v1/wordlist/vocabulary/';
  var vocabulary = $('#to_add_vocabulary').val();
  var wordlist_id = $('#wordlist-id').html();
  if (wordlist_id.length > 0 && vocabulary.length > 0) {
    var data = {
      id: wordlist_id,
      word: vocabulary
    }
    $.post(url, data, function(res) {
      $('.alert').remove();
      $('.add-vocab-succeed').removeClass('add-vocab-succeed');
      if (res.status_code != 0) {
        $('#to_add_vocabulary').before("<p class='alert alert-error'>" + res.msg + "</p>");
      } else {
        var html = $('#vocab-entry').tmpl(res.data);
        $('table tbody').prepend(html);
        $('#to_add_vocabulary').val("");
        trigger_add_example_modal();
        trigger_edit_definition_modal();
        enable_delete_button();
        update_wordlist_num_vocab(1);
      }
    });
  }
}

function delete_vocabularies() {
  var url = '/api/v1/wordlist/vocabulary/';
  var wordlist_id = $('#wordlist-id').html();
  var selected_vocabulary = $('table input[type="checkbox"]:checked');
  if (selected_vocabulary.length > 0 && wordlist_id.length > 0) {
    var ids = _.map(selected_vocabulary, function(v, i) {
      return $(v).val()
    })
    var data = {
      id: wordlist_id,
      ids: ids.join(','),
      action: 'delete'
    }
    url += '?id=' + wordlist_id;
    url += '&ids=' + ids.join(',');
    $.ajax({
      type: "POST",
      url: url,
      data: data
    }).done(function(res) {
      if (res.status_code == 0) {
        $('input[type="checkbox"]:checked').parent().parent().hide();
        $('input[type="checkbox"]:checked').attr('checked', false);
        update_wordlist_num_vocab(-ids.length);
      }
    });
  }
}

function trigger_add_example_modal() {
  $(".wordlist-add-example").unbind('click').click(prompt_add_example_modal);
}

function prompt_add_example_modal() {
  var vocabulary_id = $(this).parent().parent().find('input').attr("value");
  var wordlist_id = $('#wordlist-id').html();
  $('#example-modal .modal-body').html($('#add-example-body').html());
  $('#example-modal .modal-footer').html($('#add-example-footer').html());
  $('#example-modal .modal-body input[name="vocabulary_id"]').attr("value", vocabulary_id);
  $('#example-modal .modal-body input[name="wordlist_id"]').attr("value", wordlist_id);
  $('#example-modal').modal();
  $('.add-example').unbind('click').click(function() {
    $(this).attr('disabled', true);
    var vocabulary_id = $('#example-modal .modal-body input[name="vocabulary_id"]').attr("value");
    var wordlist_id = $('#example-modal .modal-body input[name="wordlist_id"]').attr("value");
    var original = $('#example-modal .modal-body textarea[name="original"]').val();
    var translation = $('#example-modal .modal-body textarea[name="translation"]').val();
    var post_url = "/wordlist/vocabulary/example/add/";
    $.post(post_url, {
      "vocabulary_id": vocabulary_id,
      "wordlist_id": wordlist_id,
      "original": original,
      "translation": translation
    }, function(data) {
      var new_body = $('#add-example-result-new-body').tmpl(data);
      var new_footer = $('#add-example-result-new-footer').html();
      $('#example-modal .modal-body').html(new_body);
      $('#example-modal .modal-footer').html(new_footer);
    });
  });
}

function trigger_edit_definition_modal() {
  $(".wordlist-edit-definition").unbind('click').click(prompt_edit_definition_modal);
}

function prompt_edit_definition_modal() {
  var this_dom = $(this);
  var wordlist_id = $('#wordlist-id').text();
  var vocabulary_id = $(this).attr('data');
  $(this).hide()
  var parent = $(this).parent();
  parent.find('.wordlist-vocabulary-definition').hide();
  parent.find('.wordlist-vocabulary-definition-input').show();
  $('.btn-submit-definition').unbind('click').click(function() {
    var definition = parent.find('.vocabulary-new-definition').val();
    var definition = $.trim(definition);
    var url = "/wordlist/vocabulary/definition/edit/";
    var data = {
      'vocabulary_id': vocabulary_id,
      'wordlist_id': wordlist_id,
      'definition': definition
    };
    $.post(url, data, function(res) {
      if (res.status == 0) {
        this_dom.show();
        parent.find('.wordlist-vocabulary-definition').text(definition);
        parent.find('.wordlist-vocabulary-definition').show();
        parent.find('.vocabulary-new-definition').val(definition);
        parent.find('.wordlist-vocabulary-definition-input').hide();
      } else {
        alert('failed, please contect admin')
      }
    });
  });
}