# -*- coding: utf-8 -*-
"""Untitled0.ipynb

Automatically generated by Colaboratory.

Original file is located at
    https://colab.research.google.com/drive/1h2cHSH4HKL9iC8LAMjN_GEPPMvI8RqU2
"""

from pyspark.sql.session import SparkSession
#import pyspark.sql.functions as fc
import sys
spark = SparkSession.builder.appName('anyNameHere').getOrCreate()

'''def average(n):
    df.filter( df['Volume USD'] > n ).show(10)'''
	

if __name__=="__main__":
    
    dfname = sys.argv[1]
    colname= sys.argv[2]
    op= sys.argv[3]
    value= sys.argv[4]
    df = spark.read.csv('s3://sparkcluster/'+dfname+'.csv', header=True, inferSchema=True)
    if(op=='eq'):
        df.filter( df[''+ colname] == value ).show(10)
    elif(op=='gt'):
        df.filter( df[''+ colname] > value ).show(10)
    elif(op=='lt'):
        df.filter( df[''+ colname] < value ).show(10)
    elif(op=='gte'):
        df.filter( df[''+ colname] >= value ).show(10)
    elif(op=='lte'):
        df.filter( df[''+ colname] <= value ).show(10)
    else:
        print("no data in the given condition")

   

	
	

	
	
	

	


