import type { ReportFilterDefinition } from './types';

export type FilterValue = string | number | undefined;

export type FilterValues = Record<string, FilterValue>;

export type FilterChangeHandler = (filterId: string, value: FilterValue) => void;

export type DependentFilterMap = Record<string, string>;

export type ReportFilterBarProps = {
  filterDefs: ReportFilterDefinition[];
  values: FilterValues;
  onChange: FilterChangeHandler;
  onReset: () => void;
  activeCount: number;
  isLoading?: boolean;
};
