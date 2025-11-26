@echo off
cd D:\INTRANET\Horizon

REM Copy files
xcopy /Y D:\INTRANET\Horizon\Data\Horizon_Report.xlsx D:\INTRANET\Horizon\publish\Data\
xcopy /Y D:\INTRANET\Horizon\Data\Horizon_Stocks.xlsx D:\INTRANET\Horizon\publish\Data\

echo Files copied successfully