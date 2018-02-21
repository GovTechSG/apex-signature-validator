cd "$(dirname "$0")"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
    --user-data-dir="/tmp/chrome_dev_session" \
    --disable-web-security --ignorcertificate-errors
