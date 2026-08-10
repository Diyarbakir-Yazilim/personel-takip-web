import pandas as pd
import sys

def run_export(data_path, format):
    df = pd.read_csv(data_path)
    if format == 'pdf':
        print('Exporting PDF...')
    elif format == 'xlsx':
        df.to_excel('export.xlsx')

if __name__ == '__main__':
    run_export(sys.argv[1], sys.argv[2])