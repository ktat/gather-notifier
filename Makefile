release:
	perl -p -i -e 's{"version": "([^"]+)"}{sprintf q{"version": "%s"}, ($$1 + 0.1)}e' manifest.json
	zip -q gather-notifier.zip -r background.js content*.js icon*.png manifest.json offscreen.* popup.* _locales
