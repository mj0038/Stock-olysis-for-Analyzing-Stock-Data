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
    if(op=='min'):
        df.groupBy('month').min(''+colname).show()
    elif(op=='max'):
      df.groupBy('month').max(''+colname).show()
    elif(op=='avg'):
      df.groupBy('month').avg(''+colname).show()
    elif(op=='lt' and value !="."):
      df.where(''+colname+'<'+value).show()
    elif(op=='lte' and value !="."):
      df.where(''+colname+'<='+value).show()
    elif(op=='gt' and value !="."):
      df.where(''+colname+'>'+value).show()
    elif(op=='gte' and value !="."):
      df.where(''+colname+'>='+value).show()
    elif(op=='eq' and value !="."):
      df.where(''+colname+'=='+value).show()
    else:
      print("no data in the given condition")

   

	
	

	
	
	

	



