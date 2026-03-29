(ns babytracker.schema
  (:require
   [malli.core :as m]))

(def LogEntry
  [:map
   [:label [:enum :feed :formula :vitamin-d :nap-start :nap-end]]
   [:ts pos-int?]])

(def AppState
  [:map
   [:logs [:vector LogEntry]]])

(def valid-log-entry? (m/validator LogEntry))

(defn coerce-logs
  "Filter out any malformed entries from Firebase data."
  [raw-logs]
  (filterv valid-log-entry? raw-logs))
