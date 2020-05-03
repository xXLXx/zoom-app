class ZoomOverlayClass {
    lastAttendeesListCount = 0

    zoomState = {}
    participants = {}

    messageWaitList = []

    updateParticipantVideos () {
        let $originEle = $('#suspension-active-video').closest('.suspension-content2')
        let $container = $originEle.closest('.suspension-content')

        if (!$originEle.length) {
            setTimeout(() => {
                this.updateParticipantVideos()
            }, 500)
        } else {
            /* 
             * Cleanup
             */
            $container.find('.suspension-content2:not(:nth-child(2))').remove()

            this.zoomState.attendeesList.attendeesList.forEach(participant => {
                let participantDetails = this.participants[participant.userId]

                if (participantDetails && participantDetails.video !== this.zoomState.activeVideo.id) {
                    let $newEle = $originEle.clone()

                    // $newEle.find('.suspension-canvas').src
                    $newEle.find('.suspension-user-name')
                        .html(participant.displayName)
                        .data('userid', participant.userId)

                    $container.append($newEle)
                }
            })

        }
    }

    handleSocketMessage (message) {
        console.log("message: %O", message)

        /*
         * For wait list
         */
        let tmpWaitlist = []
        this.messageWaitList.forEach(waitlist => {
            if (waitlist.criteria(message)) {
                waitlist.resolve(message)
            } else {
                tmpWaitlist.push(waitlist)
            }
        })
        this.messageWaitList = tmpWaitlist

        /*
         * For video update
         */
        if (message.body && message.body.update) {
            message.body.update.forEach(update => {
                if (typeof update.bVideoOn !== 'undefined') {

                    this.awaitMessage(function (message) {
                        if (message.body && typeof message.body.bVideoOn !== 'undefined') {
                            return true
                        }

                        return false
                    }).then((message) => {
                        this.updateParticipant(update.id, {
                            video: message.body.id
                        })
                        this.updateParticipantVideos()
                    })
                }
            })
        }
    }

    handleComponentUpdate (data) {
        this.zoomState = data

        if (this.lastAttendeesListCount != data.attendeesList.attendeesList.length) {
            this.lastAttendeesListCount = data.attendeesList.attendeesList.length
            this.onAttendeesListUpdated()
        }
        console.log("state: %O", this.zoomState)
    }

    awaitMessage (criteria, message) {
        let resolve
        let promise = new Promise((resolveFunc, reject) => {
            resolve = resolveFunc
        })

        this.messageWaitList.push({
            criteria,
            resolve
        })

        return promise
    }

    updateParticipant (id, update) {
        if (!this.participants[id]) {
            this.participants[id] = update
        } else {
            for (let key in update) {
                this.participants[id][key] = update[key]
            }
        }
    }

    onAttendeesListUpdated () {
        this.updateParticipantVideos()
    }
}

let ZoomOverlay = new ZoomOverlayClass()

export {
    ZoomOverlay,
}