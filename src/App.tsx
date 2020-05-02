import React, { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import DateFnsUtils from '@date-io/date-fns';
import { split, groupBy, uniq, zipObj } from 'ramda';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox, { CheckboxProps } from '@material-ui/core/Checkbox';
import { xor } from 'lodash';
import { DateFilters } from './DateFilters';

import './App.css';
import DetailsTable from './DetailsTable';

interface Record {
  id: string;
  date: string;
  time: string;
  type: string;
  name: string;
  emoji: string;
  category: string;
  amount: string;
  currency: string;
  localAmount: string;
  localCurrency: string;
  notes: string;
  address: string;
  receipt: string;
  description: string;
  categorySplit: string;
}

interface DisplayableRecord {
  [category: string]: number | string;
}

interface NodeData {
  id: string | number;
  value: number;
  index: number;
  indexValue: string | number;
  color: string;
  data: object;
}

const colorList = [
  '#a6cee3',
  '#1f78b4',
  '#b2df8a',
  '#33a02c',
  '#fb9a99',
  '#e31a1c',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#29dac2',
  '#b83ff7',
  '#80f318',
  '#f018f3'
];

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
  const [colorsByCategory, setColorsByCategory] = useState({});
  const [detailsTableData, setDetailsTableData] = useState([]);

  function getColors(record: Record) {
    return (colorsByCategory as any)[record.id] || 'pink';
  }

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
      setColorsByCategory(zipObj(allCategories, colorList));
      setAllCategories(allCategories);
      setFilteredCategories(allCategories);
      showRecords(records, { from: new Date(0), to: new Date() });
    };
  }

  function showRecords(records: Record[], dates: { from: Date; to: Date }) {
    console.log(records);
    const filteredRecords = filterByDate(records, dates);
    const recordsToShow = mapRecordsToDisplay(filteredRecords);
    setRecords(recordsToShow);
  }

  function getRecordsByMonth(records: Record[]): { [month: string]: Record[] } {
    const date = new DateFnsUtils();
    return groupBy<Record>(
      record =>
        `${date.getMonth(date.date(record.date)) + 1}/${date.getYear(
          date.date(record.date)
        )}`,
      records
    );
  }

  function getCategories(records: Record[]): string[] {
    return [
      ...uniq(records.map(record => record.category).filter(Boolean)),
      'unknown',
      'pot transfer'
    ];
  }

  function getRecordsFromCSV(csv: string): Record[] {
    const rows = csv
      .split('\n')
      .map(split(','))
      .map(
        ([
          id,
          date,
          time,
          type,
          name,
          emoji,
          category,
          amount,
          currency,
          localAmount,
          localCurrency,
          notes,
          address,
          receipt,
          description,
          categorySplit
        ]) => ({
          id,
          date,
          time,
          type,
          name,
          emoji,
          category,
          amount,
          currency,
          localAmount,
          localCurrency,
          notes,
          address,
          receipt,
          description,
          categorySplit
        })
      );
    const [header, ...records] = rows;
    return records;
  }

  function mapRecordsToDisplay(records: Record[]): DisplayableRecord[] {
    const recordsByMonth = getRecordsByMonth(records);
    console.log(recordsByMonth);
    const calculate = (acc: number, value: string): number => {
      return Number(((Number(acc) || 0) - Number(value)).toFixed());
    };
    let recordsToDisplay: DisplayableRecord[] = [];
    for (let i in recordsByMonth) {
      const entries = recordsByMonth[i].reduce((acc, val) => {
        let accumulated = { ...acc };

        if (Number(val.amount) < 0) {
          if (val.type.toLowerCase().includes('pot')) {
            accumulated['pot transfer'] = calculate(
              Number(acc['pot transfer']),
              val.amount
            );
            return accumulated;
          }
          const cat = val.category ? val.category : 'unknown';
          accumulated[cat] = calculate(Number(acc[val.category]), val.amount);
          return accumulated;
        } else {
          accumulated.income = calculate(Number(acc[val.category]), val.amount);
          return accumulated;
        }
      }, {} as { [category: string]: Number });
      recordsToDisplay.push({ ...entries, month: i });
    }
    console.log(recordsToDisplay);
    return recordsToDisplay;
  }

  function filterByDate(
    records: Record[],
    dates: { from: Date; to: Date }
  ): Record[] {
    return records.filter(
      record =>
        new Date(record.date) > dates.from && new Date(record.date) < dates.to
    );
  }

  function dateFilterHandler(dates: { from: Date; to: Date }) {
    const recordsToShow = filterByDate(allRecords, dates);
    showRecords(recordsToShow, dates);
  }

  function clickHandler(nodeData: NodeData) {
    console.log(nodeData);
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
          onClick={clickHandler}
          indexBy="month"
          colors={getColors}
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
      <DetailsTable></DetailsTable>
    </React.Fragment>
  );
};

export default App;
