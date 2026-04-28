const { generateCsv } = require("./csvGenerator");

describe("CSV Generator Utility", () => {
  test("should generate a CSV string correctly", async () => {
    const data = [
      { id: 1, name: "Alice", role: "Student" },
      { id: 2, name: "Bob", role: "Teacher" },
    ];
    const headers = [
      { id: "id", title: "ID" },
      { id: "name", title: "Name" },
      { id: "role", title: "Role" },
    ];

    const csv = await generateCsv(data, headers);
    const normalizedCsv = csv.replace(/\r\n/g, "\n").trim();

    expect(normalizedCsv).toContain("ID,Name,Role");
    expect(normalizedCsv).toContain("1,Alice,Student");
    expect(normalizedCsv).toContain("2,Bob,Teacher");
  });

  test("should handle empty data", async () => {
    const data = [];
    const headers = [{ id: "id", title: "ID" }];

    const csv = await generateCsv(data, headers);
    const normalizedCsv = csv.replace(/\r\n/g, "\n").trim();
    expect(normalizedCsv).toBe("ID");
  });
});
