(ns babytracker.firebase
  (:require [babytracker.schema :as schema]))

(def ^:private DB-URL
  "https://general-d26af-default-rtdb.europe-west1.firebasedatabase.app")

(defn- room-url [room]
  (str DB-URL "/tracker/" room ".json"))

(defn- js->log-entry [^js e]
  {:label (keyword (.-label e)) :ts (.-ts e)})

(defn- parse-logs [^js data]
  (let [raw (.-logs data)]
    (if raw
      (let [arr (if (js/Array.isArray raw)
                  raw
                  (js/Object.values raw))]
        (vec (sort-by :ts > (schema/coerce-logs (mapv js->log-entry arr)))))
      [])))

(defn save-state! [room logs]
  (js/fetch (room-url room)
            (clj->js {:method "PUT"
                      :headers {"Content-Type" "application/json"}
                      :body (js/JSON.stringify (clj->js {:logs logs}))})))

(defn subscribe! [room on-data on-error]
  (let [url (room-url room)]
    ;; immediate fetch for instant display on load
    (-> (js/fetch url)
        (.then #(.json %))
        (.then #(when % (on-data (parse-logs %))))
        (.catch (fn [_])))
    ;; real-time via EventSource
    (let [es (js/EventSource. url)]
      (.addEventListener es "put"
                         (fn [e]
                           (let [parsed (js/JSON.parse (.-data e))]
                             (when (.-data parsed)
                               (on-data (parse-logs (.-data parsed)))))))
      (set! (.-onerror es) on-error)
      #(.close es))))
