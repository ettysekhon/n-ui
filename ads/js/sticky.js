const debounce = require('./utils').debounce;

function Sticky (el, opts) {
	this.el = el;
	this.opts = opts || {};
	this.sibling = (opts.sibling) ? document.querySelector(opts.sibling) : null;
	this.stickUntil = (opts.stickUntil) ? document.querySelector(opts.stickUntil) : null;
	if (!el) return;
	this.opts.stickAfter = this.el.getBoundingClientRect().top;
}

Sticky.prototype.stick = function () {
	this.el.style.position = 'fixed';
	this.el.style.top = this.opts.topOffset || '0';
	if (this.sibling) {this.sibling.style.marginTop = this.el.offsetHeight + 'px';}
};

Sticky.prototype.unstick = function () {
	this.el.style.position = 'absolute';
	this.el.style.top = this.stickyUntilPoint + 'px'; //HEADER
	// this.el.style.top = (this.stickyUntilPoint - this.el.offsetHeight) + 'px'; //RHR
	this.sibling.style.marginTop = this.el.offsetHeight + 'px';
};

Sticky.prototype.onScroll = function () {
	if((this.stickyUntilPoint > window.pageYOffset) && (window.pageYOffset >= this.opts.stickAfter)) {
		requestAnimationFrame(this.stick.bind(this));
	} else if (this.stickyUntilPoint < window.pageYOffset) {
		requestAnimationFrame(this.unstick.bind(this));
	}
	else if (window.pageYOffset <= this.opts.stickAfter) {
		this.reset();
	}
};

Sticky.prototype.bindScroll = function () {
	this.onScrollListener = debounce(this.onScroll).bind(this);
	window.addEventListener('scroll', this.onScrollListener);
};

Sticky.prototype.unbindScroll = function () {
	window.removeEventListener('scroll', this.onScrollListener);
	this.onScrollListener = null;
	this.reset();
};

Sticky.prototype.onResize = function () {
	if(this.onScrollListener && this.el.offsetHeight < 10) {
		this.unbindScroll();
	} else if (!this.onScrollListener && this.el.offsetHeight >= 10) {
		this.bindScroll();
	}
	this.stickyUntilPoint = (this.stickUntil.offsetTop + this.stickUntil.offsetHeight - this.el.offsetHeight);
};

Sticky.prototype.reset = function () {
	this.el.style.position = 'static';
	this.sibling.style.marginTop = '0px';
};

Sticky.prototype.init = function () {
	if(!this.el || window.pageYOffset > 0) {
		return;
	};
	this.stickyUntilPoint = (this.stickUntil.offsetTop + this.stickUntil.offsetHeight - this.el.offsetHeight);
	this.el.style.zIndex = '23';

	window.addEventListener('resize', debounce(this.onResize).bind(this));

	this.bindScroll();
};

module.exports = Sticky;
