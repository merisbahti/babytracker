import type { Component } from "solid-js";
import { Show, createSignal, createEffect } from "solid-js";

interface TimeModalProps {
  open: boolean;
  editTs: number;
  onClose: () => void;
  onSave: (newTs: number) => void;
  onDelete: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const TimeModal: Component<TimeModalProps> = (props) => {
  const [localTs, setLocalTs] = createSignal(props.editTs);
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Reset localTs and delete confirm whenever the modal opens
  createEffect(() => {
    if (props.open) {
      setLocalTs(props.editTs);
      setShowDeleteConfirm(false);
    }
  });

  const hours = () => new Date(localTs()).getHours();
  const minutes = () => new Date(localTs()).getMinutes();
  const seconds = () => new Date(localTs()).getSeconds();

  const adjust = (unit: "h" | "m" | "s", delta: number) => {
    if (unit === "h") setLocalTs((t) => t + delta * 3600000);
    else if (unit === "m") setLocalTs((t) => t + delta * 60000);
    else setLocalTs((t) => t + delta * 1000);
  };

  return (
    <Show when={props.open}>
      <div class="modal-overlay">
        <div class="modal-box">
          <div class="modal-title">Ändra tid</div>
          <div class="modal-time-row">
            <div class="modal-time-col">
              <button class="modal-adj-btn" onClick={() => adjust("h", 1)}>+</button>
              <span class="modal-time-val">{pad2(hours())}</span>
              <button class="modal-adj-btn" onClick={() => adjust("h", -1)}>−</button>
            </div>
            <span class="modal-time-sep">:</span>
            <div class="modal-time-col">
              <button class="modal-adj-btn" onClick={() => adjust("m", 1)}>+</button>
              <span class="modal-time-val">{pad2(minutes())}</span>
              <button class="modal-adj-btn" onClick={() => adjust("m", -1)}>−</button>
            </div>
            <span class="modal-time-sep">:</span>
            <div class="modal-time-col">
              <button class="modal-adj-btn" onClick={() => adjust("s", 1)}>+</button>
              <span class="modal-time-val">{pad2(seconds())}</span>
              <button class="modal-adj-btn" onClick={() => adjust("s", -1)}>−</button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="modal-cancel-btn" onClick={props.onClose}>Avbryt</button>
            <button class="modal-save-btn" onClick={() => props.onSave(localTs())}>Spara</button>
          </div>
          <Show when={showDeleteConfirm()}>
            <div class="modal-delete-confirm">
              <div class="modal-delete-confirm-text">Säker?</div>
              <div class="modal-delete-confirm-btns">
                <button class="modal-delete-no-btn" onClick={() => setShowDeleteConfirm(false)}>Nej</button>
                <button class="modal-delete-yes-btn" onClick={props.onDelete}>Ta bort</button>
              </div>
            </div>
          </Show>
          <button class="modal-delete-btn" onClick={() => setShowDeleteConfirm(true)}>
            Ta bort händelsen
          </button>
        </div>
      </div>
    </Show>
  );
};

export default TimeModal;
