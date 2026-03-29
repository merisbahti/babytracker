(ns babytracker.events
  (:require [re-frame.core :as rf]
            [babytracker.db :as db]
            [babytracker.firebase :as firebase]))

(rf/reg-event-db
 ::initialize
 (fn [_ [_ room]]
   (assoc db/default-db :room room)))

(rf/reg-event-db
 ::set-logs
 (fn [db [_ logs]]
   (assoc db :logs logs)))

(rf/reg-event-db
 ::set-tab
 (fn [db [_ tab]]
   (assoc db :tab tab)))

(rf/reg-event-db
 ::tick
 (fn [db _]
   (update db :tick inc)))

;; --- Firebase effect ---

(rf/reg-fx
 ::persist
 (fn [[room logs]]
   (firebase/save-state! room logs)))

;; --- Log actions ---

(defn- add-log [logs label]
  (vec (take 50 (cons {:label label :ts (.now js/Date)} logs))))

(rf/reg-event-fx
 ::log-action
 (fn [{:keys [db]} [_ label]]
   (let [logs (add-log (:logs db) label)]
     {:db (assoc db :logs logs)
      ::persist [(:room db) logs]})))

;; --- Modal ---

(rf/reg-event-db
 ::open-modal
 (fn [db [_ index ts]]
   (assoc db :modal {:open? true
                     :edit-index index
                     :edit-ts ts
                     :delete-confirm? false})))

(rf/reg-event-db
 ::close-modal
 (fn [db _]
   (assoc-in db [:modal :open?] false)))

(rf/reg-event-db
 ::modal-set-ts
 (fn [db [_ ts]]
   (assoc-in db [:modal :edit-ts] ts)))

(rf/reg-event-db
 ::show-delete-confirm
 (fn [db _]
   (assoc-in db [:modal :delete-confirm?] true)))

(rf/reg-event-db
 ::hide-delete-confirm
 (fn [db _]
   (assoc-in db [:modal :delete-confirm?] false)))

(rf/reg-event-fx
 ::save-modal
 (fn [{:keys [db]} _]
   (let [{:keys [edit-index edit-ts]} (:modal db)
         new-logs (assoc (:logs db) edit-index
                         (assoc (nth (:logs db) edit-index) :ts edit-ts))]
     {:db (-> db
              (assoc :logs new-logs)
              (assoc-in [:modal :open?] false))
      ::persist [(:room db) new-logs]})))

(rf/reg-event-fx
 ::delete-entry
 (fn [{:keys [db]} _]
   (let [idx (get-in db [:modal :edit-index])
         new-logs (vec (keep-indexed #(when (not= %1 idx) %2) (:logs db)))]
     {:db (-> db
              (assoc :logs new-logs)
              (assoc-in [:modal :open?] false))
      ::persist [(:room db) new-logs]})))
