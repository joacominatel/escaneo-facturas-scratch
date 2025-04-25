"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchInvoiceChartData } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface InvoiceChartsProps {
  className?: string;
}

export function InvoiceCharts({ className }: InvoiceChartsProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getChartData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchInvoiceChartData();
        setChartData(data);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        toast("Failed to load chart data. Using sample data instead.", {
          description: "Failed to load chart data. Using sample data instead.",
        });
        // Fallback data
        setChartData(generateSampleData());
      } finally {
        setIsLoading(false);
      }
    };

    getChartData();
  }, [toast]);

  const generateSampleData = () => {
    return [
      { date: "Jan", processed: 65, pending: 28, failed: 12 },
      { date: "Feb", processed: 59, pending: 48, failed: 8 },
      { date: "Mar", processed: 80, pending: 40, failed: 10 },
      { date: "Apr", processed: 81, pending: 47, failed: 15 },
      { date: "May", processed: 56, pending: 32, failed: 5 },
      { date: "Jun", processed: 55, pending: 27, failed: 4 },
      { date: "Jul", processed: 40, pending: 24, failed: 6 },
    ];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn("", className)}
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Processing Trends</CardTitle>
              <CardDescription>
                Monthly breakdown of invoice processing status
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    processed: {
                      label: "Processed",
                      color: "hsl(var(--chart-1))",
                    },
                    pending: {
                      label: "Pending",
                      color: "hsl(var(--chart-2))",
                    },
                    failed: {
                      label: "Failed",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey="processed"
                        fill="var(--color-processed)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="pending"
                        fill="var(--color-pending)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="failed"
                        fill="var(--color-failed)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Performance</CardTitle>
              <CardDescription>
                Trend analysis of invoice processing over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <ChartContainer
                  config={{
                    processed: {
                      label: "Processed",
                      color: "hsl(var(--chart-1))",
                    },
                    pending: {
                      label: "Pending",
                      color: "hsl(var(--chart-2))",
                    },
                    failed: {
                      label: "Failed",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="processed"
                        stroke="var(--color-processed)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="var(--color-pending)"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="failed"
                        stroke="var(--color-failed)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
