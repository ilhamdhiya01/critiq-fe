import { createColumnHelper, useTable } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { sortableFeatures } from "@/lib/helpers/table.helper";

import DataTable from "../DataTable";

interface Row {
  name: string;
}

const columnHelper = createColumnHelper<typeof sortableFeatures, Row>();
const columns = columnHelper.columns([
  columnHelper.accessor("name", { header: "Name", enableSorting: false }),
]);
const DATA: Row[] = [{ name: "critiq-core" }];

const TestTable = ({
  data = DATA,
  ...props
}: Omit<React.ComponentProps<typeof DataTable<Row>>, "table"> & {
  data?: Row[];
}) => {
  const table = useTable({ features: sortableFeatures, columns, data });
  return <DataTable table={table} {...props} />;
};

const scrollBox = () => screen.getByRole("table").parentElement as HTMLElement;

describe("DataTable", () => {
  it("always wraps the table in a horizontal scroll box", () => {
    render(<TestTable columnCount={1} />);

    expect(screen.getByText("critiq-core")).toBeInTheDocument();
    expect(scrollBox()).toHaveClass("overflow-x-auto");
    expect(scrollBox()).not.toHaveClass("overflow-y-auto");
    expect(scrollBox().style.maxHeight).toBe("");
    expect(screen.getByRole("table").style.minWidth).toBe("");
  });

  it("gives the table a minimum width so narrow screens scroll", () => {
    render(<TestTable columnCount={1} minWidth={640} />);

    expect(screen.getByRole("table")).toHaveStyle({ minWidth: "640px" });
  });

  it("drops the minimum width for the empty state", () => {
    render(
      <TestTable
        columnCount={1}
        minWidth={640}
        data={[]}
        emptyMessage="Nothing here"
      />,
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByRole("table").style.minWidth).toBe("");
  });

  it("caps the height and pins the header when maxHeight is set", () => {
    render(<TestTable columnCount={1} maxHeight="480px" />);

    expect(scrollBox()).toHaveClass("overflow-x-auto", "overflow-y-auto");
    expect(scrollBox()).toHaveStyle({ maxHeight: "480px" });
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass(
      "sticky",
    );
  });
});
