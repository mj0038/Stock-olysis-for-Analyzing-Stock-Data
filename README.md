# Stockolysis: Emulation-Based System for Stock Data Analysis

## Introduction

Stockolysis is an innovative project aimed at leveraging the power of distributed computing to analyze stock market data. This project focuses on understanding stock price fluctuations influenced by various global factors, using an emulation-based system for distributed file storage and parallel computation. It's particularly essential for those seeking informed decisions in the fast-paced financial world, where handling large datasets and real-time processing are crucial.

## Project Overview

Stockolysis consists of three primary components:

1. **Emulated Distributed File System (EDFS):** A framework for distributed file storage, enabling efficient and scalable data management.
2. **Partition-based Map and Reduce (PMR):** Implementation of PMR on EDFS for advanced search and analytics.
3. **Analytical Application:** An app utilizing PMR methods for real-time analysis of stock data.

### Topic and Motivation

Intraday stock price analysis requires significant computational resources. Stockolysis addresses this by using a map-reduce system, ideal for datasets over 100 MB. The project explores best practices in database management and data analysis, focusing on stock prices in the US and India, and the impact of factors like USD-Euro exchange rates and Bitcoin values.

### Components and Architecture

#### 2.1 ER Diagram for EDFS
![ER Diagram](./images/Image%201-5-24%20at%206.59%20PM.jpg)



#### 2.2 Technology Stack
- Web Development: ReactJS
- API Building: Node.js
- Spark Cluster: AWS EMR, EC2, S3
- Databases: MySQL, MongoDB, Firebase
- Datasets: CSV files

#### 2.3 Database Schema
- **Table 1: Metadata of Files**
  - Columns: Inode, Parent Inode, Type, Permissions, Created At, Created By, Size, Path
- **Table 2: File Data**
  - Columns: Block ID, Inode, Data (JSON format), File Partition ID
- **Table 3: File Extensions**
  - Columns: Inode, Extension (e.g., JSON)

## Datasets

1. **US Stocks Dataset (433 Companies):**
   - Columns: Timestamp, Month, Stock, Open, High, Low, Close, Change
2. **Indian Stock Market Prices:**
   - Columns: Stock, Timestamp, Month, Open, High, Low, Close, Change
3. **USD vs Euros:**
   - Columns: Timestamp, Month, Open, High, Low, Close, Change
4. **Cryptocurrency (Bitcoin) Data:**
   - Columns: Timestamp, Month, Open, High, Low, Close, Change

## Conclusion

Stockolysis is a groundbreaking step in stock market analytics, offering a comprehensive, scalable solution for real-time data processing and analysis. By using distributed computing and sophisticated data management techniques, it provides vital insights into stock market trends, aiding traders and analysts in making better-informed decisions.

---

**Note:** This README provides an overview of the Stockolysis project. For detailed instructions, architecture diagrams, and API documentation, please refer to the specific sections in the project repository.
