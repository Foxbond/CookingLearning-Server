jQuery.fn.center = function () {
	this.css("position", "absolute");
	this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) +
		$(window).scrollTop()) + "px");
	this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) +
		$(window).scrollLeft()) + "px");
	return this;
};

var admin = {};

admin.init = function init() {
	//admin.showLoading();

	//admin.hideLoading();
};

admin.showOverlay = function (inst) {
	if (inst) {
		$('#overlay').show(0);
		return;
	}
	$('#overlay').fadeIn('fast');
};

admin.hideOverlay = function (inst) {
	if (inst) {
		$('#overlay').hide(0);
		return;
	}
	$('#overlay').fadeOut('fast');
};

admin.showLoading = function () {
	admin.showOverlay();
	$('#loadingBox').center().fadeIn('fast');
};

admin.hideLoading = function () {
	admin.hideOverlay();
	$('#loadingBox').fadeOut('fast');
};




/***********************/
$(document).ready(function () {
	admin.init();
});