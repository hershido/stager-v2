import React from "react";
import styles from "./ContextMenu.module.scss";
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

interface AlignmentControlsProps {
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignMiddle: () => void;
  onAlignBottom: () => void;
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
    <div>
      <div className={styles.alignmentSection}>
        <div className={styles.alignmentSectionTitle}>Alignment</div>
        <div className={styles.alignmentGrid}>
          <button
            className={styles.alignmentButton}
            onClick={onAlignLeft}
            title="Align Left"
          >
            <AlignLeftIcon />
          </button>
          <button
            className={styles.alignmentButton}
            onClick={onAlignCenter}
            title="Align Center"
          >
            <AlignCenterIcon />
          </button>
          <button
            className={styles.alignmentButton}
            onClick={onAlignRight}
            title="Align Right"
          >
            <AlignRightIcon />
          </button>
          <button
            className={styles.alignmentButton}
            onClick={onAlignTop}
            title="Align Top"
          >
            <AlignTopIcon />
          </button>
          <button
            className={styles.alignmentButton}
            onClick={onAlignMiddle}
            title="Align Middle"
          >
            <AlignMiddleIcon />
          </button>
          <button
            className={styles.alignmentButton}
            onClick={onAlignBottom}
            title="Align Bottom"
          >
            <AlignBottomIcon />
          </button>
        </div>
      </div>

      {showDistribution && (
        <div className={styles.alignmentSection}>
          <div className={styles.alignmentSectionTitle}>Distribution</div>
          <div className={styles.distributionControls}>
            <button
              className={styles.distributionButton}
              onClick={onDistributeHorizontal}
              title="Distribute Horizontally"
            >
              <DistributeHorizontalIcon />
            </button>
            <button
              className={styles.distributionButton}
              onClick={onDistributeVertical}
              title="Distribute Vertically"
            >
              <DistributeVerticalIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
