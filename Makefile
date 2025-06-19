bump-version:
	perl -p -i -e 's{"version": "([^"]+)"}{sprintf q{"version": "%s"}, ($$1 + 0.1)}e' manifest.json

zip:
	zip -q gather-notifier-$(shell grep -Eo '"version": "[^"]+?"' manifest.json |cut -d '"' -f 4).zip -r *.js icon*.png *.json *.html _locales

release: bump-version zip
