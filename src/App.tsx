import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import {
  split,
  groupBy,
  uniq,
  zipObj,
  reduce,
  mergeWith,
  add,
  omit,
  pipe,
  map,
  keys,
  pick
} from 'ramda';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { xor } from 'lodash';
import { DateFilters } from './DateFilters';
import './App.css';
import DetailsTable from './DetailsTable';
import PieChart from './Pie';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import { AppBar, Toolbar, Typography } from '@material-ui/core';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import { PieDatum } from '@nivo/pie';
import GreetingCard from './Greeting';

export interface Record {
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
  const [allRecords, setAllRecords] = useState<Record[]>([]);
  const [records, setRecords] = useState<DisplayableRecord[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [dateFilters, setDateFilters] = useState({
    from: new Date(),
    to: new Date()
  });
  const [colorsByCategory, setColorsByCategory] = useState<{}>({});
  const [detailsTableData, setDetailsTableData] = useState<Record[]>([]);
  const [pieData, setPieData] = useState<PieDatum[]>([]);

  function getColors(record: Record) {
    return (colorsByCategory as any)[record.id] || 'pink';
  }

  const handlefilter = (name: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const filtered = [...xor(filteredCategories, [name])];
    setFilteredCategories(filtered);
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
    const filteredRecords = filterByDate(records, dates);
    const recordsToShow = mapRecordsToDisplay(filteredRecords);
    setRecords(recordsToShow);
  }

  function getRecordsByMonth(records: Record[]): { [month: string]: Record[] } {
    return groupBy<Record>(record => {
      const [day, month, year] = record.date.split('/');
      return `${month}/${year}`;
    }, records);
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
    const filtered = records.filter(record => record.id);
    return filtered;
  }

  function mapRecordsToDisplay(records: Record[]): DisplayableRecord[] {
    const recordsByMonth = getRecordsByMonth(records);
    const calculate = (acc: number, value: string): number => {
      return Number(((Number(acc) || 0) - Number(value)).toFixed());
    };
    let recordsToDisplay: DisplayableRecord[] = [];
    for (let i in recordsByMonth) {
      const entries = recordsByMonth[i].reduce((acc, val) => {
        let accumulated = { ...acc };

        if (val.type.toLowerCase().includes('pot')) {
          accumulated['pot transfer'] = calculate(
            Number(acc['pot transfer']),
            val.amount
          );
          return accumulated;
        }
        if (Number(val.amount) < 0) {
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
    return recordsToDisplay;
  }

  function filterByDate(
    records: Record[],
    dates: { from: Date; to: Date }
  ): Record[] {
    return records.filter(record => {
      const [day, month, year] = record.date.split('/');
      const recordDate = new Date(Number(year), Number(month) - 1, Number(day));
      return recordDate > dates.from && recordDate < dates.to;
    });
  }

  const updatePie = useCallback(() => {
    const accumulate = reduce(mergeWith(add), {});
    const removeUnused = omit(['month', 'income']);
    const pickOnlySelectedCategories = pick(filteredCategories);
    const combine = pipe(accumulate, pickOnlySelectedCategories, removeUnused);
    const combined = combine(records);
    const result = map(
      key => ({ label: key, id: key, value: combined[key] }),
      keys(combined)
    );
    setPieData(result);
  }, [records, filteredCategories]);

  useEffect(() => {
    updatePie();
  }, [records, updatePie]);

  function dateFilterHandler(dates: { from: Date; to: Date }) {
    const recordsToShow = filterByDate(allRecords, dates);
    setDateFilters(dates);
    showRecords(recordsToShow, dates);
  }

  function clickHandler(nodeData: NodeData) {
    const filteredByMonth = allRecords.filter(record =>
      record.date.includes(nodeData.indexValue as string)
    );
    const filteredByCat = filteredByMonth.filter(
      record =>
        record.category === nodeData.id ||
        (nodeData.id === 'unknown' &&
          !record.category &&
          !record.type.toLowerCase().includes('pot'))
    );
    setDetailsTableData(filteredByCat);
  }

  const getTotalExpenses = useMemo(() => {
    const total = pieData.reduce((acc, val) => acc + Number(val.value), 0);
    return total;
  }, [pieData]);

  return (
    <div>
      <React.Fragment>
        <AppBar position="fixed">
          <Toolbar>
            <Typography variant="h6">MONZO Analytics</Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
      </React.Fragment>
      <Grid container spacing={3}>
        {allRecords.length ? (
          <>
            <Grid item xs={4} className="card">
              <Card>
                <CardContent>
                  <Typography variant="h5" color="textSecondary" gutterBottom>
                    Filter by date
                  </Typography>
                  <DateFilters
                    dateFilterChanged={dateFilterHandler}
                    defaultFromDate={new Date()}
                    defaultToDate={new Date()}
                  ></DateFilters>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={8}>
              <Card className="card">
                <CardContent>
                  <Typography variant="h5" color="textSecondary">
                    Filter by category
                  </Typography>
                  <FormGroup row>
                    <Button
                      className="category-button"
                      size="small"
                      color="primary"
                      onClick={() => setFilteredCategories(allCategories)}
                    >
                      Select All
                    </Button>
                    <Button
                      className="category-button"
                      size="small"
                      color="primary"
                      onClick={() => setFilteredCategories([])}
                    >
                      Deselect All
                    </Button>
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
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={9}>
              <Card className="card bars">
                <CardContent>
                  <Typography variant="h5" color="textSecondary">
                    Summary by month
                  </Typography>
                  <div className="bars-container">
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
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card className="card">
                <CardContent className="pie-content">
                  <Typography variant="h5" color="textSecondary">
                    Overall Summary
                  </Typography>
                  <PieChart data={pieData} getColors={getColors}></PieChart>
                  <Typography variant="body1" color="textSecondary">
                    Total expenses: £ {getTotalExpenses}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={9}>
              <Card className="card details">
                <CardContent>
                  <Typography variant="h5" color="textSecondary">
                    Details
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    Click on a bar to display details
                  </Typography>
                  <DetailsTable rows={detailsTableData}></DetailsTable>
                </CardContent>
              </Card>
            </Grid>
          </>
        ) : (
          <GreetingCard fileInputChanged={handleAddFile} />
        )}
      </Grid>
    </div>
  );
};

export default App;
