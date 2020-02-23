import React, { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import DateFnsUtils from '@date-io/date-fns';
import { map, split, groupBy, uniq } from 'ramda';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import { xor } from 'lodash';
import { DateFilters } from './DateFilters';

import './App.css';

interface Record {
  id: string;
  created: string;
  amount: string;
  currency: string;
  local_amount: string;
  local_currency: string;
  category: string;
  emoji: string;
  description: string;
  address: string;
  notes: string;
}

interface DisplayableRecord {
  [category: string]: number | string;
}

const App = () => {
  const [allRecords, setAllRecords] = useState([]);
  const [records, setRecords] = useState<
    { [category: string]: number | string }[]
  >([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [dateFilters, setDateFilters] = useState({
    from: new Date(),
    to: new Date()
  });

  const handlefilter = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilteredCategories(xor(filteredCategories, [name]));
  };

  function handleAddFile(file: File) {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const records = getRecordsFromCSV(reader.result as string);
      setAllRecords(records);
      const allCategories = getCategories(records);
      showRecords(records, { from: new Date(0), to: new Date() });
      setAllCategories(allCategories);
      setFilteredCategories(allCategories);
    };
  }

  function showRecords(records: Record[], dates: { from: Date; to: Date }) {
    const filteredRecords = filterByDate(records, dates);
    const recordsToShow = mapRecordsToDisplay(filteredRecords);
    setRecords(recordsToShow);
  }

  function getRecordsByMonth(records: Record[]): { [month: string]: Record[] } {
    const date = new DateFnsUtils();
    return groupBy<Record>(
      record =>
        `${date.getMonth(date.date(record.created)) + 1}/${date.getYear(
          date.date(record.created)
        )}`,
      records
    );
  }

  function getCategories(records: Record[]): string[] {
    return uniq(records.map(record => record.category));
  }

  function getRecordsFromCSV(csv: string): Record[] {
    const rows = csv
      .split('\n')
      .map(split(','))
      .map(
        ([
          id,
          created,
          amount,
          currency,
          local_amount,
          local_currency,
          category,
          emoji,
          description,
          address,
          notes
        ]) => ({
          id,
          created,
          amount,
          currency,
          local_amount,
          local_currency,
          category,
          emoji,
          description,
          address,
          notes
        })
      );
    const [header, ...records] = rows;
    return records;
  }

  function mapRecordsToDisplay(records: Record[]): DisplayableRecord[] {
    const recordsByMonth = getRecordsByMonth(records);
    const isIncome = (value: number) => value > 0;

    let recordsToDisplay: DisplayableRecord[] = [];
    for (let i in recordsByMonth) {
      const entries = recordsByMonth[i].reduce((acc, val) => {
        return {
          ...acc,
          ...(Number(val.amount) < 0
            ? {
                [val.category]: Number(
                  (
                    (Number(acc[val.category]) || 0) - Number(val.amount)
                  ).toFixed()
                )
              }
            : {
                income: Number(
                  ((Number(acc.income) || 0) - Number(val.amount)).toFixed()
                )
              })
        };
      }, {} as { [category: string]: Number });
      recordsToDisplay.push({ ...entries, month: i });
    }
    return recordsToDisplay;
  }

  function filterByDate(
    records: Record[],
    dates: { from: Date; to: Date }
  ): Record[] {
    return records.filter(
      record =>
        new Date(record.created) > dates.from &&
        new Date(record.created) < dates.to
    );
  }

  function dateFilterHandler(dates: { from: Date; to: Date }) {
    const recordsToShow = filterByDate(allRecords, dates);
    showRecords(recordsToShow, dates);
  }

  return (
    <React.Fragment>
      <header>Here comes the header leater</header>
      <DateFilters
        dateFilterChanged={dateFilterHandler}
        defaultFromDate={new Date()}
        defaultToDate={new Date()}
      ></DateFilters>
      <div className="App">
        <input
          type="file"
          onChange={e => handleAddFile(e.target.files?.item(0))}
        />
      </div>
      <FormGroup row>
        {allCategories.map(cat => (
          <FormControlLabel
            key={cat}
            control={
              <Checkbox
                checked={filteredCategories.includes(cat)}
                onChange={handlefilter(cat)}
                value={cat}
              />
            }
            label={cat}
          />
        ))}
      </FormGroup>
      <div className="chart-wrapper">
        <ResponsiveBar
          data={records}
          keys={filteredCategories}
          indexBy="month"
          colors={{ scheme: 'paired' }}
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'month',
            legendPosition: 'middle',
            legendOffset: 32
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'spent',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemOpacity: 1
                  }
                }
              ]
            }
          ]}
          labelSkipWidth={12}
          labelSkipHeight={12}
        />
      </div>
    </React.Fragment>
  );
};

export default App;
