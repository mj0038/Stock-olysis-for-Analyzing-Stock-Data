/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, { useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';
import { makeSelectAnalytics } from './selectors';
import { getFileColumns, search, resetSearch, getAnalytics } from './actions';
import { getPartitions } from "../Cat/actions";
import { makeSelectPartitionsList } from "../Cat/selectors";
import CatCSV from '../CatCSV';
import reducer from './reducer';
import saga from './saga';
import { Button, Card, Form, Input, Modal, Spin, Select, Row, Col, message, DatePicker } from 'antd';
import moment from 'moment';
import { ArrowLeftOutlined } from '@ant-design/icons';
import _ from 'lodash';
const key = 'analytics';

class Analytics extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isSearch: false };
  }

  componentDidMount() {
    const { db, inode } = this.props.match.params;
    this.props.getFileColumns(db, inode);
    // this.props.getPartitions(inode, db);
  }
  chooseMethod = (value) => {
    this.setState({ isSearch: value === "search" });
  }

  chooseComparator = (value) => {
    this.setState({ comparator: value });
  }

  chooseColumn = (value) => {
    this.setState({ column: value });
  }

  submitForm = (values) => {

    const { db, inode } = this.props.match.params;
    const { column, method, searchValue, operator = "===", from, to } = values;
    if (method === "search") {
      const searchFields = { column, searchValue, operator, operator, from, to };
      if (column === "timeStamp") {
        searchFields["fromDate"] = this.state.fromDate;
        searchFields["toDate"] = this.state.toDate;
        searchFields["searchValue"] = this.state.searchValue;
      }
      this.props.search({ db, inode, searchFields });
    } else {
      const { aggregate, partition } = this.state;
      const analyticsFields = { aggregate, column, partition, from, to };
      this.props.getAnalytics({ db, inode, analyticsFields });
    }
  }

  resetSearch = () => this.props.resetSearch();

  goBack = () => {
    const { db, inode, ext } = this.props.match.params;
    this.props.history.push(`/${db}/cat/${ext}/${inode}`);
  }

  setDate = (key, dt) => {
    this.setState({ [key]: moment(dt).format("YYYY-MM-DD HH:mm:ss") });
  }

  chooseAggregate = (value) => this.setState({ aggregate: value });

  choosePeriod = partition => this.setState({ partition });

  render() {
    const columnOptions = this.state.isSearch ? _.get(this.props, "analytics.fileColumns", []) : _.get(this.props, "analytics.fileColumns", []).filter(c => c !== "timeStamp" && c !== "month");
    const periodOptions = ["For Each Month", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const analyticsIsNumber = typeof (_.get(this.props, "analytics.analytics", null)) === "number";
    console.log("this.state:", this.state);
    return (
      <div>
        <Helmet>
          <title>Search & Analytics</title>
          <meta name="description" content="EDFS Project for group" />
        </Helmet>

        {/* loading modal */}
        <Modal visible={this.props.analytics.loading} footer={null} closable={false} style={{ margin: "0 auto", textAlign: "center" }} width={"10%"} centered>
          <Spin size="large" tip={_.get(this.props, "analytics.loadingString", "Loading")} />
        </Modal>

        {/* search results modal */}
        <Modal visible={_.get(this.props, "analytics.searchResults.length", 0)} width={"80%"} centered footer={false} closable={false} onCancel={this.resetSearch}>
          <CatCSV file={{ data: _.get(this.props, "analytics.searchResults", []), fileName: `Search Results` }} />
        </Modal>

        {/* Analytics modal */}
        <Modal visible={_.get(this.props, "analytics.analytics", false)} width={analyticsIsNumber ? "15%" : "40%"} centered footer={false} closable={false} onCancel={this.resetSearch}>
          {analyticsIsNumber ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <pre style={{ marginBottom: 0 }}><b>Result:</b> {_.get(this.props, "analytics.analytics", 0).toFixed(4)}</pre>
            </div>
          ) : <CatCSV file={{ data: _.get(this.props, "analytics.analytics", []), fileName: `Analytics Results` }} skipMain={true} showTimeStamp />}
        </Modal>


        <Card
          title={
            <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
              <ArrowLeftOutlined onClick={this.goBack} />
              <span style={{ marginLeft: 0, marginLeft: "2%" }}>Search & Analytics</span>
            </div>
          }
          headStyle={{ fontWeight: 'bold' }}
          style={{ width: "100%", margin: "0 auto" }}
        >
          <Form onFinish={this.submitForm}>
            <Row gutter={16}>
              {/* Search or analyse */}
              <Col span={12}>
                <Form.Item
                  name="method"
                  label="Search or analyse"
                  rules={[
                    {
                      required: true,
                      message: 'Please choose a method!',
                    },
                  ]}
                >
                  <Select onChange={this.chooseMethod}>
                    <Select.Option value="search">Search</Select.Option>
                    <Select.Option value="analyse">Analyse</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="column"
                  label="Choose Column"
                  rules={[
                    {
                      required: true,
                      message: 'Please choose a column!',
                    },
                  ]}
                >
                  <Select onChange={this.chooseColumn}>
                    {columnOptions.map((col, index) => {
                      return <Select.Option key={index} value={col}>{col}</Select.Option>
                    })}
                  </Select>
                </Form.Item>
              </Col>

              {this.state.isSearch ?
                <Col span={24}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="operator"
                        label="Operator"
                        rules={[
                          {
                            required: true,
                            message: 'Please choose an operation!',
                          },
                        ]}
                      >
                        <Select onChange={this.chooseComparator}>
                          <Select.Option key={0} value={"==="}>Exact Match</Select.Option>
                          <Select.Option key={1} value={"<"}>Lesser Than</Select.Option>
                          <Select.Option key={2} value={">"}>Greater Than</Select.Option>
                          <Select.Option key={3} value={"<="}>Lesser Than Equal</Select.Option>
                          <Select.Option key={4} value={">="}>Greater Than Equal</Select.Option>
                          <Select.Option key={5} value={"between"}>Between</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    {this.state.comparator === "between" ? (
                      this.state.column === "timeStamp" ? (
                        <Col span={12}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="fromDate"
                                label="From Date"
                                rules={[{ required: true, message: 'Select start date.', }]}
                              >
                                <DatePicker onChange={dt => this.setDate("fromDate", dt)} showTime />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="toDate"
                                label="To Date"
                                rules={[{ required: true, message: 'Select end date.', }]}
                              >
                                <DatePicker onChange={dt => this.setDate("toDate", dt)} showTime />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                      ) : (
                        <Col span={12}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name="from"
                                label="From"
                                rules={[{ required: true, message: 'Please enter a lower boundary(included).', }]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="to"
                                label="To"
                                rules={[{ required: true, message: 'Please enter an upper boundary(included).', }]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Col>
                      )
                    ) : (
                      this.state.column === "timeStamp" ? (
                        <Col span={12}>
                          <Form.Item
                            name="searchValue"
                            label="Date"
                            rules={[{ required: true, message: 'Select a date.', }]}
                          >
                            <DatePicker onChange={dt => this.setDate("searchValue", dt)} showTime />
                          </Form.Item>
                        </Col>
                      ) : (
                        <Col span={12}>
                          <Form.Item
                            name="searchValue"
                            label="Value"
                            rules={[{ required: true, message: 'Please enter a value.', }]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                      )
                    )}
                  </Row>
                </Col>
                : <Col span={24}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="aggregate"
                        label="Aggregate"
                        rules={[
                          {
                            required: true,
                            message: 'Please choose an aggregate!',
                          },
                        ]}
                      >
                        <Select onChange={this.chooseAggregate}>
                          {/* <Select.Option key={"count"} value={"count"}>Count</Select.Option>
                          <Select.Option key={"sum"} value={"sum"}>Sum</Select.Option> */}
                          <Select.Option key={"min"} value={"min"}>Minimum</Select.Option>
                          <Select.Option key={"max"} value={"max"}>Maximum</Select.Option>
                          <Select.Option key={"avg"} value={"avg"}>Average</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="partitionValue"
                        label="Period"
                        rules={[
                          {
                            required: true,
                            message: 'Please choose a period!',
                          },
                        ]}
                      >
                        <Select onChange={this.choosePeriod}>
                          {periodOptions.map((partition, index) => {
                            return <Select.Option key={index} value={partition === "For Each Month" ? "*" : partition}>{partition}</Select.Option>
                          })}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>}
              <Col span={24} style={{ display: "flex", justifyContent: "center" }}>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    {this.state.isSearch ? "Search" : "Analyse"}
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card >

      </div >
    );
  }
}

Analytics.propTypes = {
  loading: PropTypes.bool
};

const withReducer = injectReducer({ key, reducer });
const withSaga = injectSaga({ key, saga });

const mapStateToProps = createStructuredSelector({
  analytics: makeSelectAnalytics(),
  partitions: makeSelectPartitionsList(),
});

export function mapDispatchToProps(dispatch) {
  return {
    getFileColumns: (db, inode) => dispatch(getFileColumns(db, inode)),
    search: (params) => dispatch(search(params)),
    resetSearch: () => dispatch(resetSearch()),
    getPartitions: (inode, db) => dispatch(getPartitions(inode, db)),
    getAnalytics: (params) => dispatch(getAnalytics(params)),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withReducer,
  withSaga,
  withConnect,
  memo,
)(Analytics);
