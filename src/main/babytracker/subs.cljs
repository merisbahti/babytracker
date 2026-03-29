(ns babytracker.subs
  (:require [re-frame.core :as rf]
            [clojure.string :as str]))

(rf/reg-sub ::logs  (fn [db _] (:logs db)))
(rf/reg-sub ::tab   (fn [db _] (:tab db)))
(rf/reg-sub ::tick  (fn [db _] (:tick db)))
(rf/reg-sub ::room  (fn [db _] (:room db)))
(rf/reg-sub ::modal (fn [db _] (:modal db)))

(defn- latest-ts [logs label]
  (or (:ts (first (filter #(= (:label %) label) logs))) 0))

(rf/reg-sub
 ::derived
 :<- [::logs]
 (fn [logs _]
   (let [napping? (loop [[entry & rest] logs]
                    (cond
                      (nil? entry) false
                      (= (:label entry) "😴 Nap startad") true
                      (str/starts-with? (:label entry) "💤 Nap avslutad") false
                      :else (recur rest)))
         nap-start (when napping?
                     (:ts (first (filter #(= (:label %) "😴 Nap startad") logs))))
         last-end  (first (filter #(str/starts-with? (:label %) "💤 Nap avslutad") logs))
         last-start (when last-end
                      (first (filter #(and (= (:label %) "😴 Nap startad")
                                           (<= (:ts %) (:ts last-end)))
                                     logs)))]
     {:napping?          napping?
      :nap-start         (or nap-start 0)
      :last-nap-end      (or (:ts last-end) 0)
      :last-nap-duration (if (and last-end last-start)
                           (- (:ts last-end) (:ts last-start))
                           0)
      :last-feed         (latest-ts logs "🍽️ Matad")
      :last-formula      (latest-ts logs "🍼 Ersättning")
      :last-vitamin-d    (latest-ts logs "☀️ D-vitamin")})))
