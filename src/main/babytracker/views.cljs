(ns babytracker.views
  (:require [re-frame.core :as rf]
            [babytracker.events :as events]
            [babytracker.subs :as subs]
            [babytracker.utils :as utils]))

(defn- label->display [label & [duration]]
  (case label
    :feed      "🍽️ Matad"
    :formula   "🍼 Ersättning"
    :vitamin-d "☀️ D-vitamin"
    :nap-start "😴 Nap startad"
    :nap-end   (str "💤 Nap avslutad" (when duration (str " · " (utils/format-duration duration))))
    (str label)))

;; --- Nap button ---

(defn nap-button []
  (let [{:keys [napping? nap-start last-nap-end last-nap-duration]} @(rf/subscribe [::subs/derived])
        _ @(rf/subscribe [::subs/tick])
        nap-dur  (when (and napping? (pos? nap-start)) (- (.now js/Date) nap-start))
        sub-text (cond
                   napping?            (utils/format-duration nap-dur)
                   (pos? last-nap-end) (str "Senaste: " (utils/format-duration last-nap-duration)
                                            " · " (utils/time-ago last-nap-end))
                   :else               "")]
    [:button.nap-btn
     {:style    {:background (if napping? "#7a2020" "#2a6a2a")
                 :box-shadow (if napping? "0 4px 0 #4a1010" "0 4px 0 #1a4a1a")}
      :on-click #(rf/dispatch [::events/log-action (if napping? :nap-end :nap-start)])}
     [:div (if napping? "⏹ Avsluta nap" "▶ Starta nap")]
     [:div.nap-btn-sub sub-text]]))

;; --- Action buttons ---

(defn action-buttons []
  (let [{:keys [last-feed last-formula last-vitamin-d]} @(rf/subscribe [::subs/derived])
        _ @(rf/subscribe [::subs/tick])]
    [:<>
     [nap-button]
     [:div.grid2
      [:button.big-btn
       {:style    {:background "#1a4a6a" :box-shadow "0 4px 0 #0a2a4a"}
        :on-click #(rf/dispatch [::events/log-action :feed])}
       [:span.big-btn-emoji "🍽️"]
       [:span.big-btn-label "Matad"]
       [:span.big-btn-sub (utils/time-ago last-feed)]]
      [:button.big-btn
       {:style    {:background "#6a3a1a" :box-shadow "0 4px 0 #3a1a00"}
        :on-click #(rf/dispatch [::events/log-action :formula])}
       [:span.big-btn-emoji "🍼"]
       [:span.big-btn-label "Ersättning"]
       [:span.big-btn-sub (utils/time-ago last-formula)]]
      [:button.big-btn
       {:style    {:background "#5a4a00" :box-shadow "0 4px 0 #2a2200" :grid-column "1 / -1"}
        :on-click #(rf/dispatch [::events/log-action :vitamin-d])}
       [:span.big-btn-emoji "☀️"]
       [:span.big-btn-label "D-vitamin"]
       [:span.big-btn-sub (utils/time-ago last-vitamin-d)]]]]))

;; --- Summary ---

(defn summary []
  (let [{:keys [last-feed last-formula
                last-vitamin-d
                last-nap-end
                last-nap-duration]} @(rf/subscribe [::subs/derived])
        _ @(rf/subscribe [::subs/tick])
        val-str #(if (pos? %) (str (utils/format-time %) " · " (utils/time-ago %)) "—")]
    [:div.summary
     [:div.summary-title "Senast"]
     [:div.sum-row [:span "🍽️ Mat"]       [:span (val-str last-feed)]]
     [:div.sum-row [:span "🍼 Ersättning"] [:span (val-str last-formula)]]
     [:div.sum-row [:span "☀️ D-vitamin"]  [:span (val-str last-vitamin-d)]]
     [:div.sum-row
      [:span "💤 Nap" (when (pos? last-nap-duration) (str " · " (utils/format-duration last-nap-duration)))]
      [:span (if (pos? last-nap-end)
               (str (utils/format-time last-nap-end) " · " (utils/time-ago last-nap-end))
               "—")]]]))

;; --- Log tab ---

(defn log-tab []
  (let [logs @(rf/subscribe [::subs/enriched-logs])
        _    @(rf/subscribe [::subs/tick])]
    [:div.log-pad
     [:div.log-hint "Tryck på en rad för att ändra tid"]
     (if (empty? logs)
       [:div {:style {:text-align "center" :color "#bbb" :padding "40px"}} "Ingen logg än"]
       (map-indexed
        (fn [i {:keys [label ts duration]}]
          ^{:key i}
          [:div.log-entry {:on-click #(rf/dispatch [::events/open-modal i ts])}
           [:span.log-entry-label (label->display label duration)]
           [:span.log-entry-time (str (utils/format-time ts) " · " (utils/time-ago ts))]])
        logs))]))

;; --- Time modal ---

(defn time-modal []
  (let [{:keys [open? edit-ts delete-confirm?]} @(rf/subscribe [::subs/modal])]
    (when open?
      (let [d        (js/Date. edit-ts)
            adjust!  #(rf/dispatch [::events/modal-set-ts (+ edit-ts %)])]
        [:div.modal-overlay
         [:div.modal-box
          [:div.modal-title "Ändra tid"]
          [:div.modal-time-row
           [:div.modal-time-col
            [:button.modal-adj-btn {:on-click #(adjust! 3600000)}  "+"]
            [:span.modal-time-val (utils/pad2 (.getHours d))]
            [:button.modal-adj-btn {:on-click #(adjust! -3600000)} "−"]]
           [:span.modal-time-sep ":"]
           [:div.modal-time-col
            [:button.modal-adj-btn {:on-click #(adjust! 60000)}  "+"]
            [:span.modal-time-val (utils/pad2 (.getMinutes d))]
            [:button.modal-adj-btn {:on-click #(adjust! -60000)} "−"]]
           [:span.modal-time-sep ":"]
           [:div.modal-time-col
            [:button.modal-adj-btn {:on-click #(adjust! 1000)}  "+"]
            [:span.modal-time-val (utils/pad2 (.getSeconds d))]
            [:button.modal-adj-btn {:on-click #(adjust! -1000)} "−"]]]
          [:div.modal-actions
           [:button.modal-cancel-btn {:on-click #(rf/dispatch [::events/close-modal])} "Avbryt"]
           [:button.modal-save-btn   {:on-click #(rf/dispatch [::events/save-modal])}  "Spara"]]
          (if delete-confirm?
            [:div
             [:div.modal-delete-confirm-text "Säker?"]
             [:div.modal-delete-confirm-btns
              [:button.modal-delete-no-btn  {:on-click #(rf/dispatch [::events/hide-delete-confirm])} "Nej"]
              [:button.modal-delete-yes-btn {:on-click #(rf/dispatch [::events/delete-entry])}        "Ta bort"]]]
            [:button.modal-delete-btn {:on-click #(rf/dispatch [::events/show-delete-confirm])}
             "Ta bort händelsen"])]]))))

;; --- Root ---

(defn app []
  (let [room @(rf/subscribe [::subs/room])
        tab  @(rf/subscribe [::subs/tab])]
    (if-not room
      [:div {:style {:display "flex" :align-items "center" :justify-content "center"
                     :height "100vh" :color "#888" :font-size "16px"
                     :padding "20px" :text-align "center"}}
       "Ange ?room= i URL:en (cljtest)"]
      [:<>
       [:div.tabs
        [:button {:class    (str "tab-btn" (when (= tab :main) " tab-btn--active"))
                  :on-click #(rf/dispatch [::events/set-tab :main])} "Hem"]
        [:button {:class    (str "tab-btn" (when (= tab :log) " tab-btn--active"))
                  :on-click #(rf/dispatch [::events/set-tab :log])} "Logg"]]
       (when (= tab :main)
         [:div.main-pad
          [action-buttons]
          [summary]])
       (when (= tab :log)
         [log-tab])
       [time-modal]])))
