import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from '@material-ui/pickers';
import React, { useState, FunctionComponent } from 'react';
import DateFnsUtils from '@date-io/date-fns';

export interface DateFiltersProps {
  dateFilterChanged: (dates: { from: Date; to: Date }) => void;
  defaultFromDate: Date;
  defaultToDate: Date;
}

export const DateFilters: FunctionComponent<DateFiltersProps> = (
  props: DateFiltersProps
) => {
  const [selectedStartDate, setSelectedStartDate] = useState(
    props.defaultFromDate
  );
  const [selectedEndDate, setSelectedEndDate] = useState(props.defaultToDate);

  const handleStartDateChange = (date: Date | null) => {
    setSelectedStartDate(date);
    props.dateFilterChanged({ from: date, to: selectedEndDate });
  };

  const handleEndDateChange = (date: Date | null) => {
    setSelectedEndDate(date);
    props.dateFilterChanged({ from: selectedStartDate, to: date });
  };
  return (
    <React.Fragment>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <KeyboardDatePicker
          disableToolbar
          variant="inline"
          format="MM/dd/yyyy"
          margin="normal"
          id="date-picker-inline"
          label="Start date"
          value={selectedStartDate}
          onChange={handleStartDateChange}
          KeyboardButtonProps={{
            'aria-label': 'change date'
          }}
        />
        <KeyboardDatePicker
          disableToolbar
          variant="inline"
          format="MM/dd/yyyy"
          margin="normal"
          id="date-picker-inline"
          label="End date"
          value={selectedEndDate}
          onChange={handleEndDateChange}
          KeyboardButtonProps={{
            'aria-label': 'change date'
          }}
        />
      </MuiPickersUtilsProvider>
    </React.Fragment>
  );
};
