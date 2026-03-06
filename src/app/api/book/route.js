// TODO: Students must implement CRUD for Book here, similar to Item.
// Example: GET (list all books), POST (create book)
import {requireRole} from '@/lib/auth.js'
import  corsHeaders  from '@/lib/cors.js'
import { NextResponse } from 'next/server';
import { getClientPromise } from "@/lib/mongodb";
// import necessary modules and setup as in Item

export async function OPTIONS(req) {
  return new Response(null, {
      status: 200,
      headers: corsHeaders,
  });
}

export async function GET(req) {
  // TODO: Implement list all books
  const { user, error, status } = requireRole(req, "admin", "user");
  if (error) return NextResponse.json({ message: error }, { status, headers: corsHeaders });
  try {
      const { searchParams } = new URL(req.url);
      // const page = parseInt(searchParams.get('page')) || 1;
      // const limit = parseInt(searchParams.get('limit')) || 10;
      // const skip = (page - 1) * limit;

      const client = await getClientPromise();
      const db = client.db("final-01");
      let result
      if (user.role === "ADMIN") {
         result = await db.collection("book")
            .find({})
            .toArray();
      } else {
         result = await db.collection("book")
            .find({Status:"ACTIVE" })
            .toArray();
      }
      console.log("==> result", result);
      return NextResponse.json({
          items: result,
      }, {
          headers: corsHeaders
      });
  }
  catch (exception) {
      console.log("exception", exception.toString());
      const errorMsg = exception.toString();
      return NextResponse.json({
          message: errorMsg
      }, {
          status: 400,
          headers: corsHeaders
      })
  }
}
export async function POST(req) {
      // TODO: Implement create a new book
  const { error, status } = requireRole(req, "admin");
  if (error) return NextResponse.json({ message: error }, { status, headers: corsHeaders });
  const data = await req.json();
  console.log(data)
  const bookTitle = data.title;
  const bookAuthor = data.author;
  const bookQuantity = data.quantity;
  const bookLocation = data.location
  try {
      const client = await getClientPromise();
      const db = client.db("final-01");
      const newBook = {
        Title: bookTitle,
          Author: bookAuthor,
          Quantity: bookQuantity,
          Location: bookLocation,
          Status: "ACTIVE"
      }
      console.log(newBook)
      const result = await db.collection("book").insertOne(newBook);
      console.log(result)
      return NextResponse.json({
          id: result.insertedId
      }, {
          status: 200,
          headers: corsHeaders
      })
  }
  catch (exception) {
      console.log("exception", exception.toString());
      const errorMsg = exception.toString();
      return NextResponse.json({
          message: errorMsg
      }, {
          status: 400,
          headers: corsHeaders
      })
  }
} 
