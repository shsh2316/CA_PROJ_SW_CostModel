#region

using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Web.UI;
using System.Web.UI.WebControls;
#endregion
namespace Ports
{
    // MS SQL Server counterpart to dbClass (CSClass/dbClass.cs), scaffolded for the Vessel ETA/ATA
    // migration. Method signatures mirror dbClass so in-scope pages can switch DAL with minimal
    // code churn. Query strings passed in still use Oracle syntax until they are rewritten to T-SQL
    // in the follow-up phase - this class only replaces the Oracle plumbing.
    public class dbClassSql
    {
        public delegate void connectionStateChangedHandler(bool status);

        private static readonly string mCCCConString = ConfigurationManager.ConnectionStrings["CCCConString"].ConnectionString;
        public SqlConnection CCCCon;
        private bool dbConnectionStatus;
        private SqlCommand oAnySqlCommand;
        private int TrialNo;

        static dbClassSql()
        {
            getdbClassInstance.createConnection();
        }

        public bool DBConnectionStatus
        {
            get => dbConnectionStatus;
            private set
            {
                if (dbConnectionStatus == value) return;
                dbConnectionStatus = value;
                if (ConnectionStateChanged == null) return;
                try
                {
                    ConnectionStateChanged(dbConnectionStatus);
                }
                catch (Exception)
                {
                    dbConnectionStatus = false;
                }
            }
        }

        public SqlConnection GetConncetion => CCCCon;

        public static dbClassSql getdbClassInstance { get; } = new dbClassSql();

        public static event connectionStateChangedHandler ConnectionStateChanged;

        private void createConnection()
        {
            try
            {
                CCCCon = new SqlConnection(mCCCConString);
                CCCCon.Open();
                DBConnectionStatus = true;
            }
            catch (Exception)
            {
                DBConnectionStatus = false;
            }
        }

        private static bool IsConnectionLost(SqlException ex)
        {
            switch (ex.Number)
            {
                case -1:
                case -2:
                case 2:
                case 10053:
                case 10054:
                case 10060:
                case 10061:
                    return true;
                default:
                    return false;
            }
        }

        private static bool IsUniqueConstraintViolation(SqlException ex)
        {
            return ex.Number == 2627 || ex.Number == 2601;
        }

        public string SelectRecordString(string strQuery)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                oAnySqlCommand = new SqlCommand(strQuery, CCCCon);
                object SelectedValue = Convert.ToString(oAnySqlCommand.ExecuteScalar());
                return SelectedValue.ToString();
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        public string SelectRecordFromDatabase(string strQuery)
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(mCCCConString))
                {
                    connection.Open();

                    SqlCommand cmd = new SqlCommand
                    {
                        Connection = connection,
                        CommandText = strQuery,
                        CommandType = CommandType.Text
                    };

                    SqlDataAdapter da = new SqlDataAdapter(cmd);
                    DataTable dt = new DataTable();
                    da.Fill(dt);

                    if (dt == null || dt.Rows.Count <= 0)
                    {
                        return null;
                    }

                    return dt.Rows[0][0].ToString();
                }
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }

        public DataSet SelectDS(string strQuery)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                oAnySqlCommand = new SqlCommand(strQuery, CCCCon);
                var objSQLDataAdapter = new SqlDataAdapter(oAnySqlCommand);
                var objDS = new DataSet();
                objSQLDataAdapter.Fill(objDS);
                return objDS;
            }
            catch (SqlException ex)
            {
                DBConnectionStatus = false;
                var errDataSet = new DataSet();
                var dt = new DataTable();
                dt.Columns.Add("ErrorNo");
                dt.Columns.Add("Error");
                var row = dt.NewRow();
                row["ErrorNo"] = ex.Number;
                row["Error"] = ex.Message;
                dt.Rows.Add(row);
                errDataSet.Tables.Add(dt);
                return errDataSet;
            }
            catch (Exception ex)
            {
                DBConnectionStatus = false;
                var errDataSet = new DataSet();
                var dt = new DataTable();
                dt.Columns.Add("ErrorNo");
                dt.Columns.Add("Error");
                var row = dt.NewRow();
                row["ErrorNo"] = ex.Source;
                row["Error"] = ex.Message;
                dt.Rows.Add(row);
                errDataSet.Tables.Add(dt);
                return errDataSet;
            }
        }

        public DataTable SelectDT(string strQuery)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                oAnySqlCommand = new SqlCommand(strQuery, CCCCon);
                var objSQLDataAdapter = new SqlDataAdapter(oAnySqlCommand);
                var objDT = new DataTable();
                objSQLDataAdapter.Fill(objDT);
                return objDT;
            }
            catch (SqlException ex)
            {
                DBConnectionStatus = false;
                var dt = new DataTable();
                dt.Columns.Add("ErrorNo");
                dt.Columns.Add("Error");
                var row = dt.NewRow();
                row["ErrorNo"] = ex.Number;
                row["Error"] = ex.Message;
                dt.Rows.Add(row);
                return dt;
            }
            catch (Exception ex)
            {
                DBConnectionStatus = false;
                var dt = new DataTable();
                dt.Columns.Add("ErrorNo");
                dt.Columns.Add("Error");
                var row = dt.NewRow();
                row["ErrorNo"] = ex.Source;
                row["Error"] = ex.Message;
                dt.Rows.Add(row);
                return dt;
            }
        }

        public SqlDataReader SelectDataReader_(string strQuery)
        {
            return SelectDataReader(strQuery);
        }

        public SqlDataReader SelectDataReader(string strQuery)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                SqlCommand cmd = new SqlCommand(strQuery, CCCCon);
                return cmd.ExecuteReader();
            }
            catch (SqlException)
            {
                DBConnectionStatus = false;
                return null;
            }
            catch (Exception)
            {
                DBConnectionStatus = false;
                return null;
            }
        }

        /// <summary>
        ///     Method is used to perform insert operation on database
        /// </summary>
        public bool insertIntoDatabase(string queryToBeExecuted)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                oAnySqlCommand = new SqlCommand(queryToBeExecuted, CCCCon);
                oAnySqlCommand.ExecuteScalar();
                DBConnectionStatus = true;
                return true;
            }
            catch (SqlException ex)
            {
                if (IsConnectionLost(ex))
                {
                    TrialNo++;
                    if (TrialNo < 3) createConnection();
                }
                return false;
            }
        }

        public string InsertDBReturnId(string queryToBeExecuted)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                SqlParameter outputParameter = new SqlParameter("@ReturnPara", SqlDbType.Decimal)
                {
                    Direction = ParameterDirection.Output
                };
                oAnySqlCommand = new SqlCommand(queryToBeExecuted, CCCCon);
                oAnySqlCommand.Parameters.Add(outputParameter);
                oAnySqlCommand.ExecuteNonQuery();
                return Convert.ToString(outputParameter.Value);
            }
            catch (SqlException ex)
            {
                if (IsConnectionLost(ex))
                {
                    TrialNo++;
                    if (TrialNo < 3) createConnection();
                }
                return null;
            }
        }

        public bool InsertUpdate(string queryToBeExecuted, string updatequery)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                oAnySqlCommand = new SqlCommand(queryToBeExecuted, CCCCon);
                oAnySqlCommand.ExecuteScalar();
                DBConnectionStatus = true;
                return true;
            }
            catch (SqlException ex)
            {
                if (IsConnectionLost(ex))
                {
                    TrialNo++;
                    if (TrialNo < 3) createConnection();
                }
                else if (IsUniqueConstraintViolation(ex))
                {
                    insertIntoDatabase(updatequery);
                }
                return true;
            }
        }

        public int ExecuteNonQuery(string query)
        {
            using (SqlCommand command = new SqlCommand(query, CCCCon))
            {
                try
                {
                    return command.ExecuteNonQuery();
                }
                catch (SqlException ex)
                {
                    Console.WriteLine($"Database error: {ex.Message}");
                    return -1;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Generic error: {ex.Message}");
                    return -1;
                }
            }
        }

        public bool ExecuteNonQueryWithCommit(string strQuery, SqlParameter[] parameters = null)
        {
            SqlTransaction transaction = null;
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                oAnySqlCommand = new SqlCommand(strQuery, CCCCon);
                transaction = CCCCon.BeginTransaction();
                oAnySqlCommand.Transaction = transaction;

                if (parameters != null)
                {
                    oAnySqlCommand.Parameters.AddRange(parameters);
                }

                int rowsAffected = oAnySqlCommand.ExecuteNonQuery();
                transaction.Commit();
                return rowsAffected > 0;
            }
            catch (SqlException ex)
            {
                transaction?.Rollback();
                DBConnectionStatus = false;
                Console.WriteLine("SQL Server Error executing query: " + ex.Message);
                return false;
            }
            catch (Exception ex)
            {
                transaction?.Rollback();
                DBConnectionStatus = false;
                Console.WriteLine("General Error executing query: " + ex.Message);
                return false;
            }
        }

        public bool UploadFile(SqlCommand cmd)
        {
            try
            {
                if (CCCCon == null || CCCCon.State == ConnectionState.Closed)
                {
                    createConnection();
                }
                cmd.Connection = CCCCon;
                cmd.ExecuteNonQuery();
                DBConnectionStatus = true;
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// bind only for dropdown
        public void BindDropdown(DropDownList d, string q, string i, string n, string p, Page page)
        {
            try
            {
                using (SqlCommand cmd = new SqlCommand(q, CCCCon))
                using (SqlDataReader rdr = cmd.ExecuteReader())
                {
                    d.Items.Clear();
                    d.Items.Add(new ListItem("-- Select --", ""));

                    int io = rdr.GetOrdinal(i);
                    int no = rdr.GetOrdinal(n);
                    int oco = string.IsNullOrEmpty(p) ? -1 : rdr.GetOrdinal(p);

                    while (rdr.Read())
                    {
                        string id = rdr.IsDBNull(io) ? null : rdr[io].ToString();
                        string name = rdr.IsDBNull(no) ? null : rdr[no].ToString();
                        string category = oco == -1 || rdr.IsDBNull(oco) ? "" : rdr[oco].ToString();

                        if (name != null && id != null)
                        {
                            string displayValue = name;
                            string storedValue = id;

                            if (!string.IsNullOrEmpty(category))
                            {
                                displayValue = $"{name}";
                                storedValue = $"{id},{category}";
                            }

                            ListItem item = new ListItem(displayValue, storedValue);
                            item.Attributes["title"] = string.IsNullOrEmpty(category) ? name : $"{name} - {category}";

                            d.Items.Add(item);
                        }
                        else
                        {
                            System.Diagnostics.Debug.WriteLine($"Warning: Missing ID or Name (ID: {id ?? "N/A"}, Name: {name ?? "N/A"})");
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                string errorMessage = ex.Message.Replace("\n", "\\n").Replace("\"", "\\\"");
                string script = $"alert(\"Error: {errorMessage}\");";
                page.ClientScript.RegisterStartupScript(page.GetType(), "ErrorAlert", script, true);
            }
        }

        #region dropdown single
        public void DropDownData(string query, DropDownList ddl, string name, string id, string list_name)
        {
            using (SqlConnection connection = new SqlConnection(mCCCConString))
            {
                connection.Open();

                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        ddl.DataSource = reader;
                        ddl.DataTextField = name;
                        ddl.DataValueField = id;
                        ddl.DataBind();
                    }
                }
            }
        }
        #endregion
    }
}

