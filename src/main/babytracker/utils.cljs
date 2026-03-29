(ns babytracker.utils)

(defn time-ago [ts]
  (if (zero? ts)
    "—"
    (let [diff (quot (- (.now js/Date) ts) 1000)]
      (cond
        (< diff 60)   (str diff "s")
        (< diff 3600) (str (quot diff 60) "m")
        :else (let [h (quot diff 3600)
                    m (quot (mod diff 3600) 60)]
                (if (pos? m) (str h "t " m "m") (str h "t")))))))

(defn format-time [ts]
  (if (zero? ts)
    "—"
    (let [d (js/Date. ts)]
      (str (-> d .getHours str (.padStart 2 "0")) ":"
           (-> d .getMinutes str (.padStart 2 "0"))))))

(defn format-duration [ms]
  (let [s (quot ms 1000)
        h (quot s 3600)
        m (quot (mod s 3600) 60)]
    (if (pos? h)
      (str h "t " m "m")
      (str m "m"))))

(defn pad2 [n]
  (-> n str (.padStart 2 "0")))
