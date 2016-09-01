#!/bin/sh
if [ "${ADD_SETTINGS_BUNDLE}" == "YES" ]; then
cp -r "${PROJECT_DIR}/Settings.bundle" "${BUILT_PRODUCTS_DIR}/${PRODUCT_NAME}.app"
fi
