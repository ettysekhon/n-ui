const AppInitializer = require('../js/app-app').AppInitializer;
const header = require('../../components/n-ui/header');
const footer = require('o-footer');
const date = require('o-date');
const ads = require('../../components/n-ui/ads');
const tracking = require('../../components/n-ui/tracking');
const sw = require('n-service-worker');
import nImage from 'n-image';

describe.only('AppInitializer', () => {
	before(() => {
		window.FT = {
			flags: [{name: 'aFlag', state: 'cohort'}],
			conditions: {}
		};
	});

	beforeEach(() => {
		window.LUX = {mark: sinon.stub()}
		sinon.stub(header, 'init');
		sinon.stub(footer, 'init');
		sinon.stub(date, 'init');
		sinon.stub(ads, 'init');
		sinon.stub(tracking, 'init');
		sinon.stub(tracking, 'lazyInit');
		sinon.stub(sw, 'register');
		sinon.stub(sw, 'message');
		sinon.stub(sw, 'unregister');
		sinon.stub(nImage, 'lazyLoad')
	})

	afterEach(() => {
		header.init.restore();
		footer.init.restore();
		date.init.restore();
		ads.init.restore();
		tracking.init.restore();
		tracking.lazyInit.restore();
		sw.register.restore();
		sw.message.restore();
		sw.unregister.restore();
		nImage.lazyLoad.restore();
	})

	describe('constructor', () => {
		it('exposes appInfo', () => {
			document.documentElement.setAttribute('data-next-is-production', ''),
			document.documentElement.setAttribute('data-next-version', '1'),
			document.documentElement.setAttribute('data-next-app', 'appname'),
			document.documentElement.setAttribute('data-next-product', 'productname')

			const result = new AppInitializer();
			expect(result.env.appInfo.isProduction).to.equal(true);
			expect(result.env.appInfo.version).to.equal('1');
			expect(result.env.appInfo.name).to.equal('appname');
			expect(result.env.appInfo.product).to.equal('productname');

			document.documentElement.removeAttribute('data-next-is-production');
			document.documentElement.removeAttribute('data-next-version');
			document.documentElement.removeAttribute('data-next-app');
			document.documentElement.removeAttribute('data-next-product');
		});

		it('exposes flags with getters', () => {
			const result = new AppInitializer();
			expect(result.env.flags.get).to.be.a('function');
			expect(result.env.flags.getAll).to.be.a('function');
			expect(result.env.flags.aFlag).to.equal('cohort');
			expect(result.env.flags.get('aFlag')).to.equal('cohort');
		});

		it('exposes allStylesLoaded promise, which is resolved if styles already loaded', () => {
			window.FT.conditions.allStylesLoaded = true;
			const result = new AppInitializer();
			expect(result.env.allStylesLoaded.then).to.be.a('function');

			return result.env.allStylesLoaded
				.then(() => {
					expect(true); // will time out otherwise
					delete window.FT.conditions.AllStylesLoaded;
				})
		});

		it('exposes allStylesLoaded promise, which resolves after styles load', () => {
			const result = new AppInitializer();
			expect(result.env.allStylesLoaded.then).to.be.a('function');
			let isResolved = false;
			result.env.allStylesLoaded
				.then(() => {
					isResolved = true;
				})

			expect(isResolved).to.be.false;
			window.dispatchEvent(new CustomEvent('FT.allStylesLoaded'));
			return new Promise(res => (setTimeout(res, 50)))
				.then(() => {
					expect(isResolved).to.be.true;
				})
		});
	});

	describe('bootstrap', () => {
		let app;

		beforeEach(() => {
			app = new AppInitializer();
			sinon.stub(app, 'initializeComponents');
		});

		it('converts discrete preset to header, footer and date features', () => {

			app.bootstrap({preset: 'discrete'})
			expect(app.enabledFeatures).to.eql({
				header: true,
				footer: true,
				date: true
			});
		});

		it('converts complete preset to header, footer, date and intrusive features', () => {
			app.bootstrap({preset: 'complete'})
			expect(app.enabledFeatures).to.eql({
				header: true,
				footer: true,
				date: true,
				cookieMessage: true,
				ads: true,
				syndication: true
			});
		});

		it('overrides features in presets', () => {
			app.bootstrap({preset: 'discrete', features: {ads: true}})
			expect(app.enabledFeatures).to.eql({
				header: true,
				footer: true,
				date: true,
				ads: true
			});
		});

		it('calls initializeComponents', () => {
			app.bootstrap();
			expect(app.initializeComponents.called).to.be.true;
		});

		it('sets a perf mark', () => {
			app.bootstrap();
			expect(window.LUX.mark.calledWith('nUiJsExecuted')).to.be.true;
		});

		it('returns env object', () => {
			expect(app.bootstrap()).to.equal(app.env);
		});
	});

	describe('initializeComponents', () => {

		function initApp(features, flags) {
			const app = AppInitializer();
			if (flags) {
				app.env.flags = flags;
			}
			app.enabledFeatures = features;
			app.initializeComponents();
			return app;
		}

		it('always initializes tracking', () => {
			const app = initApp({});
			expect(tracking.init.calledWith(app.env.flags, app.env.appInfo)).to.be.true;
		});

		it('initializes service worker if flag is on', () => {
			const app = initApp({}, {serviceWorker: true});
			expect(sw.register.calledWith(app.env.flags)).to.be.true;
			expect(sw.message.calledWith({ type: 'updateCache', data: {}})).to.be.true;
		});

		it('unregisters service worker if flag is off', () => {
			const app = initApp({}, {serviceWorker: false});
			expect(sw.unregister.called).to.be.true;
		});

		it('initializes header if feature is enabled', () => {
			const app = initApp({header: true});
			expect(header.init.calledWith(app.env.flags)).to.be.true;
		});

		it('does not initialize header if feature is disabled', () => {
			const app = initApp({});
			expect(header.init.called).to.be.false;
		});

		it('initializes date if feature is enabled', () => {
			const app = initApp({date: true});
			expect(date.init.called).to.be.true;
		});

		it('does not initialize date if feature is disabled', () => {
			const app = initApp({});
			expect(date.init.called).to.be.false;
		});

		it('initializes ads if feature is enabled', () => {
			const app = initApp({ads: {adsConfig: true}});
			expect(ads.init.calledWith(app.env.flags, app.env.appInfo, app.enabledFeatures.ads)).to.be.true;
		});

		it('does not initialize ads if feature is disabled', () => {
			const app = initApp({});
			expect(ads.init.called).to.be.false;
		});

		it('initializes lazy loaded images if feature is enabled', () => {
			const app = initApp({lazyLoadImages: true});
			expect(nImage.lazyLoad.called).to.be.true;
		});

		it('does not initialize lazy loaded images if feature is disabled', () => {
			const app = initApp({});
			expect(nImage.lazyLoad.called).to.be.false;
		});

		describe('after allStylesLoaded', () => {
			it('initializes footer if feature is enabled', () => {

			});

			it('does not initialize footer if feature is disabled', () => {

			});

			it('initializes cookie message if feature is enabled and flag is on', () => {

			});

			it('does not initialize cookie message if feature is disabled', () => {

			});

			it('does not initialize cookie message if flag is off', () => {

			});

			it('does not initialize syndication if feature is disabled', () => {

			});
		});
	});

	describe('onAppInitialiazed', () => {

		it('adds js-success class to html element', () => {
			new AppInitializer().onAppInitialized();
			expect(document.documentElement.classList.contains('js-success')).to.be.true;
		});

		it('sets a perf mark', () => {
			new AppInitializer().onAppInitialized();
			expect(window.LUX.mark.calledWith('appJsExecuted')).to.be.true;
		});

		it('initializes lazy tracking', () => {
			const app = new AppInitializer();
			app.onAppInitialized();
			expect(tracking.lazyInit.calledWith(app.env.flags)).to.be.true;
		});

		it.skip('dispatches loaded event after app is done (if done after window loaded)', () => {
			// no test written before, not gonna beat myself about not writing one in the new suite
		});

		it.skip('dispatches loaded event after window loaded (if app done before window loaded)', () => {
			// no test written before, not gonna beat myself about not writing one in the new suite
		});

	});
});