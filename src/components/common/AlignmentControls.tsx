import React from "react";
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignMiddleIcon,
  AlignBottomIcon,
  DistributeHorizontalIcon,
  DistributeVerticalIcon,
} from "./AlignmentIcons";
import styles from "../common/ContextMenu.module.scss";

interface AlignmentControlsProps {
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignMiddle?: () => void;
  onAlignBottom?: () => void;
  showDistribution?: boolean;
  onDistributeHorizontal?: () => void;
  onDistributeVertical?: () => void;
}

export const AlignmentControls: React.FC<AlignmentControlsProps> = ({
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  showDistribution = false,
  onDistributeHorizontal,
  onDistributeVertical,
}) => {
  return (
    <div className={styles.alignmentContainer}>
      <div className={styles.alignmentGroup}>
        <div className={styles.alignmentLabel}>Horizontal Align</div>
        <div className={styles.alignmentRow}>
          <button
            className={styles.alignmentMenuItem}
            onClick={onAlignLeft}
            disabled={!onAlignLeft}
          >
            <AlignLeftIcon />
            <span>Left</span>
          </button>
          <button
            className={styles.alignmentMenuItem}
            onClick={onAlignCenter}
            disabled={!onAlignCenter}
          >
            <AlignCenterIcon />
            <span>Center</span>
          </button>
          <button
            className={styles.alignmentMenuItem}
            onClick={onAlignRight}
            disabled={!onAlignRight}
          >
            <AlignRightIcon />
            <span>Right</span>
          </button>
        </div>
      </div>

      <div className={styles.alignmentGroup}>
        <div className={styles.alignmentLabel}>Vertical Align</div>
        <div className={styles.alignmentRow}>
          <button
            className={styles.alignmentMenuItem}
            onClick={onAlignTop}
            disabled={!onAlignTop}
          >
            <AlignTopIcon />
            <span>Top</span>
          </button>
          <button
            className={styles.alignmentMenuItem}
            onClick={onAlignMiddle}
            disabled={!onAlignMiddle}
          >
            <AlignMiddleIcon />
            <span>Middle</span>
          </button>
          <button
            className={styles.alignmentMenuItem}
            onClick={onAlignBottom}
            disabled={!onAlignBottom}
          >
            <AlignBottomIcon />
            <span>Bottom</span>
          </button>
        </div>
      </div>

      {showDistribution && (
        <div className={styles.alignmentGroup}>
          <div className={styles.alignmentLabel}>Distribute</div>
          <div className={styles.alignmentRow}>
            <button
              className={styles.alignmentMenuItem}
              onClick={onDistributeHorizontal}
              disabled={!onDistributeHorizontal}
            >
              <DistributeHorizontalIcon />
              <span>Horizontal</span>
            </button>
            <button
              className={styles.alignmentMenuItem}
              onClick={onDistributeVertical}
              disabled={!onDistributeVertical}
            >
              <DistributeVerticalIcon />
              <span>Vertical</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
