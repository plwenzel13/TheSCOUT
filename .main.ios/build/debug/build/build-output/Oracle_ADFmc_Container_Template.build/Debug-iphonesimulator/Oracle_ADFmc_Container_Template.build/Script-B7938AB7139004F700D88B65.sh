#!/bin/sh
rsync -r --exclude=.svn "${SRCROOT}/CustomResources/" "${TARGET_BUILD_DIR}/${PRODUCT_NAME}.app"

