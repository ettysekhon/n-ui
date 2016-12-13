include n.Makefile

demo: run

run:
	rm -rf bower_components/n-ui
	mkdir bower_components/n-ui
	cp -rf $(shell cat _test-server/template-copy-list.txt) bower_components/n-ui
	node _test-server/app

build:
	webpack --config webpack.config.demo.js --dev

watch:
	webpack --config webpack.config.demo.js --dev --watch


test-unit:
	karma start karma.conf.js

test-unit-dev:
	karma start karma.conf.js --single-run false --auto-watch true

test-build:
	webpack --config webpack.config.demo.js

nightwatch:
	nht nightwatch test/js-success.nightwatch.js

a11y: test-build
	node .pa11yci.js
	rm -rf bower_components/n-ui
	mkdir bower_components/n-ui
	cp -rf $(shell cat _test-server/template-copy-list.txt) bower_components/n-ui
	PA11Y=true node _test-server/app

# test: verify test-unit test-build run nightwatch a11y

test:
	@echo 'Temporarily failing all builds while debugging deploy issues'
	exit 2

test-dev: verify test-unit-dev

deploy: assets
	node ./_deploy/s3.js
	$(MAKE) npm-publish

serve:
	@echo '`make serve` is no longer needed to bower link.'
	@echo 'Instead set the environment variable `NEXT_APP_SHELL=local` in your app'
	@echo 'and run `make build run` etc in the app'
	exit 2
