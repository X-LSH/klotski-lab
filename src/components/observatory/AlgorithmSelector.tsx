/**
 * 算法选择器（观测台）。
 */
import { ALGORITHM_LABELS, ALL_ALGORITHMS, type AlgorithmName } from '../../solver/registry';

interface AlgorithmSelectorProps {
  algorithm: AlgorithmName;
  disabled: boolean;
  onChange: (algorithm: AlgorithmName) => void;
}

export default function AlgorithmSelector({
  algorithm,
  disabled,
  onChange,
}: AlgorithmSelectorProps) {
  return (
    <div className="algorithm-selector" role="radiogroup" aria-label="选择算法">
      {ALL_ALGORITHMS.map((name) => (
        <button
          key={name}
          type="button"
          role="radio"
          aria-checked={algorithm === name}
          className={
            algorithm === name
              ? 'algorithm-selector__item algorithm-selector__item--active'
              : 'algorithm-selector__item'
          }
          disabled={disabled}
          onClick={() => onChange(name)}
        >
          {ALGORITHM_LABELS[name]}
        </button>
      ))}
    </div>
  );
}
