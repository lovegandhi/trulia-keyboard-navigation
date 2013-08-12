###
// ==UserScript==
// @name           Trulia Keyboard Navigation
// @author         Taulant Dhami
// @version        0.3
// @description    Adds some keyboard accessibility to Trulia.
// @include        http://www.trulia.com/*
//  used for Chrome
// @match          http://www.trulia.com/*
// ==/UserScript==
###

withJquery = (func) ->
    myDoc = document
    fragment = myDoc.createDocumentFragment()
    script = myDoc.createElement("script")

    script.type = "text/javascript"
    script.textContent = "(#{func.toString()})(jQuery)"
    fragment.appendChild(script)
    myDoc.body.appendChild(fragment)
    return

withJquery ($) ->
    TruliaKeyboard =
        localStorage:
            get: (key) ->
                return localStorage.getItem(key)
            set: (key, value) ->
                localStorage.setItem(key, value)
                return
        sessionStorage:
            get: (key) ->
                return sessionStorage.getItem(key)
            set: (key, value) ->
                sessionStorage.setItem(key, parseInt(value, 10))
                return
        ui:
            resultsEl       : '#result_list'
            nextPageEl      : '#paging_next'
            closeWindowEl   : '#iw_close'
            previousPhotoEl : '.ss_prev'
            nextPhotoEl     : '.ss_next'
            dislikeEl       : '.dislike'
            saveHomeEl      : '.property_action_follow'
            addressEl       : '.infowindow_address'
            pricingBoxEl    : '.infowindow_pricing'
            infoBoxEl       : '.infowindow_box'
        state:
            stateRowId: "rowId"
            stateTotalRows: "totalRows"
            setRow: (value) ->
                TruliaKeyboard.sessionStorage.set(@stateRowId, parseInt(value, 10))
                return
            getRow: ->
                return TruliaKeyboard.sessionStorage.get(@stateRowId)
            setTotalRows: (value) ->
                TruliaKeyboard.sessionStorage.set(@stateTotalRows, parseInt(value, 10))
                return
            getTotalRows: ->
                return TruliaKeyboard.sessionStorage.get(@stateTotalRows)
        helper:
            fireKeydownEvent: (key) ->
                event = $.Event('keydown')
                event.keyCode = key
                $(document).trigger(event)
                return
            propertyId: ->
                row = TruliaKeyboard.state.getRow()
                return $(TruliaKeyboard.ui.resultsEl)
                            .children()[if row > 1 then row - 1 else row]
                            .attributes['data-property-id'].value
            propertyUrl: ->
                return "http://www.trulia.com/property/#{@propertyId()}"
            showHome: (rowId, eventCode) ->
                row = $(TruliaKeyboard.ui.resultsEl).children()[rowId]
                propertyId = "#homevalue-marker-#{row.attributes['data-property-id'].value}"

                # setting this before event trigger below, otherwise, tab crash.
                TruliaKeyboard.state.setRow(parseInt(rowId, 10) + 1)

                if row.attributes['class'].value.indexOf('hidden_row') isnt -1
                    # hidden property, skipp it.
                    # use the same event code to navigate in the same direction
                    TruliaKeyboard.helper.fireKeydownEvent(eventCode)
                else
                    $(propertyId).click()

                return
            clickElement: (element, eventCode) ->
                el = $(element)
                el.click()
                return
            flashMessage: (message) ->
                myDoc = document
                flashDiv = $('#flash')

                if flashDiv.length is 0
                    div = myDoc.createElement('div')
                    style = 'display:none; text-align:center; margin-top:220px; color:green'

                    div.id = 'flash'
                    div.setAttribute('style', style)
                    $(TruliaKeyboard.ui.infoBoxEl).after(div)
                    flashDiv = $('#flash')

                flashDiv.text(message).fadeIn 'normal', ->
                    $(@).delay(3000).fadeOut()
                    return
                    
                return

    _tk = TruliaKeyboard
    totalRows = $(_tk.ui.resultsEl).children().length

    _tk.state.setRow(0)
    _tk.state.setTotalRows(totalRows)

    document.resultsUpdated = (event) ->
        # this event gets fired when moving the map or when
        # you load next page/previous page of results.
        totalRows = $(_tk.ui.resultsEl).children().length
        _tk.state.setRow(0)
        _tk.state.setTotalRows(totalRows)

        # After results are updated we need to look in LocalStorage for
        # saved properties and highlight previously saved properties.
        return

    # Key codes: http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

    document.onkeydown = (event) ->
        eventCode = (if event.keyCode? then event.keyCode else event.which)
        ESC = 27
        r = 82
        h = 72
        l = 76
        n = 78
        k = 75
        j = 74
        y = 89

        switch eventCode
            when ESC
                # ESC to close preview
                _tk.helper.clickElement(_tk.ui.closeWindowEl, eventCode)
                return
            when r
                # reset
                _tk.state.setRow(0)
                _tk.helper.fireKeydownEvent(j)
                return
            when h
                # previous photo
                _tk.helper.clickElement(_tk.ui.previousPhotoEl, eventCode)
                return
            when l
                # next photo
                _tk.helper.clickElement(_tk.ui.nextPhotoEl, eventCode)
                return
            when n
                # hide property
                _tk.helper.clickElement(_tk.ui.dislikeEl, eventCode)
                _tk.helper.fireKeydownEvent(j)
                return
            when k
                # previous property
                _tk.helper.showHome(_tk.state.getRow() - 2, eventCode)
                return
            when y
                # save property to local storage
                _tk.helper.clickElement(_tk.ui.saveHomeEl, eventCode)
                _tk.helper.flashMessage('Property saved.')
                return
            when j
                # next property
                rowId = _tk.state.getRow()
                el = $(_tk.ui.nextPageEl)

                if rowId is _tk.state.getTotalRows()
                    # we are at the end of the list, load next page
                    el.click()
                    return
                else
                    _tk.helper.showHome(rowId, eventCode)
                    return
            else
                console.log('No event got caught')
                return

    return