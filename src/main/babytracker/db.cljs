(ns babytracker.db
  (:require [malli.experimental :as mx]))

(def default-db
  {:logs []
   :room nil
   :tab :main
   :tick 0
   :modal {:open? false
           :edit-index -1
           :edit-ts 0
           :delete-confirm? false}})
