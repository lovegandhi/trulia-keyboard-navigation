// ==UserScript==

// @name           Trulia Keyboard Navigation
// @author         Taulant Dhami
// @version        0.2
// @description    Adds some keyboard accessibility to Trulia.

// @include        http://www.trulia.com/*

//  used for Chrome
// @match          http://www.trulia.com/*
// ==/UserScript==

function withJquery(f) {
    "use strict";
    /*jslint browser:true */
    /*global document*/

    var myDoc = document,
        fragment = myDoc.createDocumentFragment(),
        script = myDoc.createElement('script');

    script.type = "text/javascript";
    script.textContent = "(" + f.toString() + ")(jQuery)";
    fragment.appendChild(script);

    myDoc.body.appendChild(fragment);
}

withJquery(function ($) {
    "use strict";
    /*jslint browser:true */
    /*jslint nomen: true */ /* to allow _tk */
    /*global localStorage, sessionStorage, console*/

    var debug = false;

    var TruliaKeyboard = {
        localStorage: {
            get: function (key) {
                var retVal = localStorage.getItem(key);
                TruliaKeyboard.helper.log('localStorage.get with key: ' + key + ' return: ' + retVal);
                return retVal;
            },
            set: function (key, value) {
                TruliaKeyboard.helper.log('localStorage.set with key: ' + key + ' value: ' + value);
                localStorage.setItem(key, value);
            }
        },
        sessionStorage: {
            // passign 10 for decimal
            get: function (key) {
                var retVal = sessionStorage.getItem(key);
                TruliaKeyboard.helper.log('sessionStorage.get with key: ' + key + ' return: ' + retVal);
                return retVal;
            },
            set: function (key, value) {
                TruliaKeyboard.helper.log('sessionStorage.set with key: ' + key + ' value: ' + value);
                sessionStorage.setItem(key, parseInt(value, 10));
            }
        },
        ui: {
            resultsEl       : '#result_list',
            nextPageEl      : '#paging_next',
            closeWindowEl   : '#iw_close',
            previousPhotoEl : '.ss_prev',
            nextPhotoEl     : '.ss_next',
            dislikeEl       : '.dislike',
            saveHomeEl      : '.property_action_follow',
            addressEl       : '.infowindow_address',
            pricingBoxEl    : '.infowindow_pricing',
            infoBoxEl       : '.infowindow_box'
        },
        state: {
            stateRowId: 'rowId',
            stateTotalRows: 'totalRows',
            setRow : function (value) {
                TruliaKeyboard.helper.log('state.setRow with value: ' + parseInt(value, 10));
                TruliaKeyboard.sessionStorage.set(this.stateRowId, parseInt(value, 10));
            },
            getRow : function () {
                var retVal = TruliaKeyboard.sessionStorage.get(this.stateRowId);
                TruliaKeyboard.helper.log('state.getRow with return: ' + retVal);
                return retVal;
            },
            setTotalRows : function (value) {
                TruliaKeyboard.helper.log('state.setTotalRows with value: ' + parseInt(value, 10));
                TruliaKeyboard.sessionStorage.set(this.stateTotalRows, parseInt(value, 10));
            },
            getTotalRows : function () {
                var retVal = TruliaKeyboard.sessionStorage.get(this.stateTotalRows);
                TruliaKeyboard.helper.log('state.getTotalRows with return: ' + retVal);
                return retVal;
            }
        },
        helper: {
            log: function (data) {
                if (debug) {
                    console.log(data);
                }
            },
            propertyId : function () {
                var row = TruliaKeyboard.state.getRow(),
                    retVal = $(TruliaKeyboard.ui.resultsEl)
                                .children()[(row > 1) ? row - 1 : row]
                                .attributes['data-property-id'].value;
                this.log('helper.propertyId for row: ' + row + ' return: ' + retVal);
                return retVal;
            },
            propertyUrl: function () {
                var retVal = 'http://www.trulia.com/property/' + this.propertyId();
                this.log('helper.propertyUrl return: ' + retVal);
                return retVal;
            },
            showHome : function (rowId, eventCode) {
                var row = $(TruliaKeyboard.ui.resultsEl).children()[rowId],
                    propertyId = '#homevalue-marker-' + row.attributes['data-property-id'].value;

                this.log('showHome row: ' + row);
                this.log('showHome rowId: ' + rowId);
                this.log('showHome propertyId: ' + propertyId);

                // setting this before event trigger below, otherwise, tab crash.
                TruliaKeyboard.state.setRow(parseInt(rowId, 10) + 1);

                if (row.attributes['class'].value.indexOf('hidden_row') !== -1) {
                    // hidden property, skipp it.
                    // use the same event code to navigate in the same direction
                    var event = $.Event('keyup');
                    event.keyCode = eventCode;
                    $(document).trigger(event);
                } else {
                    $(propertyId).click();
                }
            },
            clickElement: function (element, eventCode) {
                var el = $(element);
                this.log('EventCode: ' + eventCode + ' element: ' + element);
                el.click();
            },
            flashMessage: function (message) {
                var myDoc = document,
                    flashDiv = $('#flash');

                if (flashDiv.length === 0) {
                    var div = myDoc.createElement('div'),
                        style = 'display:none; text-align:center; margin-top:230px; color:green';

                    div.id = 'flash';
                    div.setAttribute('style', style);
                    $(TruliaKeyboard.ui.infoBoxEl).after(div);
                    flashDiv = $('#flash');
                }

                flashDiv.text(message)
                        .fadeIn('normal', function() {
                            $(this).delay(3000).fadeOut();
                        });
            }
        }
    };


    var _tk = TruliaKeyboard,
        totalRows = $(_tk.ui.resultsEl).children().length;

    _tk.helper.log('TotalRows: ' + totalRows);
    _tk.state.setRow(0);
    _tk.state.setTotalRows(totalRows);

    document.resultsUpdated = function (event) {
        // this event gets fired when moving the map or when
        // you load next page/previous page of results.
        var totalRows = $(_tk.ui.resultsEl).children().length;
        _tk.helper.log('Results have been updated');
        _tk.state.setRow(0);
        _tk.state.setTotalRows(totalRows);
    }

    document.onkeyup = function (event) {
        var element,
            eventCode = (event.keyCode || event.which),
            ESC = 27,
            h = 72,
            l = 76,
            n = 78,
            k = 75,
            j = 74,
            y = 89;

        if (eventCode === ESC) { // ESC to close preview
            _tk.helper.clickElement(_tk.ui.closeWindowEl, eventCode);
        }
        if (eventCode === h) { // previous photo
            _tk.helper.clickElement(_tk.ui.previousPhotoEl, eventCode);
        }
        if (eventCode === l) { // next photo
            _tk.helper.clickElement(_tk.ui.nextPhotoEl, eventCode);
        }
        if (eventCode === n) { // hide property
            _tk.helper.clickElement(_tk.ui.dislikeEl, eventCode);
        }
        if (eventCode === k) { // previous property
            _tk.helper.showHome(_tk.state.getRow() - 2, eventCode);
        }
        if (eventCode === y) { // save property to local storage
            _tk.helper.clickElement(_tk.ui.saveHomeEl, eventCode);
            _tk.helper.flashMessage('Property saved.');
        }
        if (eventCode === j) { // next property
            var rowId = _tk.state.getRow(),
                el = $(_tk.ui.nextPageEl);

            _tk.helper.log('J - rowId: ' + rowId);
            _tk.helper.log('J - totalRows: ' + _tk.state.getTotalRows());

            if (rowId === _tk.state.getTotalRows()) {
                // we are at the end of the list, load next page
                el.click();
            } else {
                _tk.helper.showHome(rowId, eventCode);
            }
        }
    }
});
