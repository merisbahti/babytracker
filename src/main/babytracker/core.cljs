(ns babytracker.core
  (:require [reagent.dom :as rdom]
            [re-frame.core :as rf]
            [babytracker.events :as events]
            [babytracker.firebase :as firebase]
            [babytracker.views :as views]))

(defonce ^:private unsub!   (atom nil))
(defonce ^:private tick-id  (atom nil))

(defn mount []
  (rdom/render [views/app] (.getElementById js/document "root")))

(defn init []
  (let [room (.get (js/URLSearchParams. (.-search js/location)) "room")]
    (rf/dispatch-sync [::events/initialize room])
    (when room
      (when-let [f @unsub!] (f))
      (reset! unsub!
              (firebase/subscribe!
               room
               #(rf/dispatch [::events/set-logs %])
               #())))
    (when-not @tick-id
      (reset! tick-id
              (js/setInterval #(rf/dispatch [::events/tick]) 1000)))
    (mount)))
