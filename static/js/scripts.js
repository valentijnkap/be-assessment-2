/* Code from: https://stackoverflow.com/questions/13780309/get-filename-from-input-type-file-using-jquery?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa */

$(document).ready(function (){
	$('.storiewrapper').masonry({
	  itemSelector: '.storypost',
	  columnWidth: 370,
	  gutter: 30
	})

	$('.fileInputLabel').click(function() {
	  $('#fileInput').change(function() {
	    var filename = $('#fileInput').val()
	    filename = filename.slice(12)
	    $('.filename').html(filename)
	  })
	})
})