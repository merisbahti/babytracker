(ns babytracker.core
  (:require [reagent.dom :as rdom]
            [re-frame.core :as rf]
            [babytracker.events :as events]
            [babytracker.firebase :as firebase]
            [babytracker.views :as views]
            ^:dev [malli.dev.cljs :as malli-dev]))

(defonce ^:private unsub!   (atom nil))
(defonce ^:private tick-id  (atom nil))

(defn mount []
  (when ^boolean goog.DEBUG (malli-dev/start!))
  (rdom/render [views/app] (.getElementById js/document "root")))

(defonce ^:private visibility-listener (atom nil))

(defn- subscribe-room! [room]
  (when-let [f @unsub!] (f))
  (reset! unsub!
          (firebase/subscribe!
           room
           #(rf/dispatch [::events/set-logs %])
           #())))

(defn init []
  (let [url-room   (.get (js/URLSearchParams. (.-search js/location)) "room")
        saved-room (js/localStorage.getItem "room")
        room       (or url-room saved-room)]
    (when url-room (js/localStorage.setItem "room" url-room))
    (rf/dispatch-sync [::events/initialize room])
    (when room
      (subscribe-room! room)
      (when-not @visibility-listener
        (let [listener (fn []
                         (when (= (.-visibilityState js/document) "visible")
                           (subscribe-room! room)))]
          (reset! visibility-listener listener)
          (.addEventListener js/document "visibilitychange" listener))))
    (when-not @tick-id
      (reset! tick-id
              (js/setInterval #(rf/dispatch [::events/tick]) 1000)))
    (mount)))
