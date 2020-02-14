import React, { useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import DateFnsUtils from '@date-io/date-fns';
import { map, split, groupBy } from 'ramda';

import './App.css';

interface RecordList {
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

const App = () => {
  const [records, setRecords] = useState([]);
  const [categiries, setCategories] = useState([]);

  function handleAddFile(file: File) {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      const records = (reader.result as string)
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
      const [headers, ...results] = records;
      const date = new DateFnsUtils();
      const byMonths = groupBy<RecordList>(
        record =>
          `${date.getMonthText(date.date(record.created))} ${date.getYear(
            date.date(record.created)
          )}`,
        results
      );

      let byMonthGroup = [];
      for (let i in byMonths) {
        // byMonthGroup.push({ ...byMonths[i], month: i });
        const obj = byMonths[i].reduce((acc, val) => {
          return {
            ...acc,
            [val.category]: Number(acc[val.category]) || 0 - Number(val.amount)
          };
        }, {} as { [category: string]: Number });
        byMonthGroup.push({ [i]: obj });
      }

      // let data = byMonthGroup.map(month => {
      //   return month.reduce((acc, val) => {
      //     return {
      //       [val.category]: Number(acc.category) + Number(val.category)
      //     };
      //   }, {} as { [category: string]: Number });
      // });

      console.log(byMonths, byMonthGroup);
      // setRecords(results);
    };
  }

  const data = [
    { month: 'january', 'eating-out': 60, bills: 120 },
    { month: 'february', 'eating-out': 50, bills: 134 },
    { month: 'march', 'eating-out': 50, bills: 134 },
    { month: 'april', 'eating-out': 50, bills: 134 }
  ];

  return (
    <React.Fragment>
      <header>Here comes the header leater</header>
      <div className="App">
        <input
          type="file"
          onChange={e => handleAddFile(e.target.files?.item(0))}
        />
      </div>
      <div className="chart-wrapper">
        <ResponsiveBar
          data={data}
          keys={['eating-out', 'bills']}
          indexBy="month"
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
        />
      </div>
    </React.Fragment>
  );
};

export default App;
